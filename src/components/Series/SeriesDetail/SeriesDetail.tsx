import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectActiveProfileId, selectIsAdmin } from '@/store/features/auth/selector'
import {
	selectCurrentSeries,
	selectSeriesLoading,
	selectSeriesError,
	fetchSeriesById,
	clearCurrentSeries,
	updateEpisodeWatchState,
	updateEpisodeRating,
	updateSeasonRating,
	updateSeriesRating,
	updateSeasonWatchStates,
	updateAllWatchStates,
	invalidateCache,
} from '@/store/features/series'
import {
	RatingDisplay,
	MediaPoster,
	EpisodeToggle,
	WatchStateBadge,
	PosterPickerModal,
	StarRating,
	CastSection,
} from '@/components/elements'
import { WatchState } from '@/models/api/Enums'
import {
	updateEpisodeState,
	uploadCustomPoster,
	rateSeries,
	rateEpisode,
	rateSeason,
	setSeasonState,
	setSeriesAllState,
	getSeriesCredits,
	addManually,
} from '@/services/MediaService/MediaService'
import { deleteMediaItem, refreshMediaItem } from '@/services/AdminService/AdminService'
import {
	removeMediaFromProfile,
	blockMediaForProfile,
	unblockMediaForProfile,
} from '@/services/ProfileService/ProfileService'
import type { SeasonDto } from '@/models/api'
import './SeriesDetail.scss'

const CalendarIcon = () => (
	<svg viewBox='0 0 24 24' width='12' height='12' fill='currentColor' opacity='.6'>
		<path d='M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z' />
	</svg>
)

const SeriesDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>()
	const { t, i18n } = useTranslation()
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const series = useAppSelector(selectCurrentSeries)
	const loading = useAppSelector(selectSeriesLoading)
	const error = useAppSelector(selectSeriesError)
	const activeProfileId = useAppSelector(selectActiveProfileId)
	const isAdmin = useAppSelector(selectIsAdmin)
	const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set())
	const [uploadError, setUploadError] = useState<string | null>(null)
	const [refreshing, setRefreshing] = useState(false)
	const [refreshingImages, setRefreshingImages] = useState(false)
	const [showPosterPicker, setShowPosterPicker] = useState(false)
	const [showLogoPicker, setShowLogoPicker] = useState(false)
	const [savingRating, setSavingRating] = useState(false)
	const [isAddingToLibrary, setIsAddingToLibrary] = useState(false)
	const posterInputRef = useRef<HTMLInputElement>(null)
	const menuRef = useRef<HTMLDivElement>(null)
	const [showMenu, setShowMenu] = useState(false)
	const [showConfirmDelete, setShowConfirmDelete] = useState(false)
	const [showConfirmRemove, setShowConfirmRemove] = useState(false)
	const [showConfirmBlock, setShowConfirmBlock] = useState(false)
	const [posterVersion, setPosterVersion] = useState(0)
	const [datePickerTarget, setDatePickerTarget] = useState<
		{ type: 'season'; seasonId: number } | { type: 'series' } | null
	>(null)
	const [customDate, setCustomDate] = useState('')
	const datePickerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (id) {
			dispatch(fetchSeriesById({ id: Number(id), profileId: activeProfileId }))
		}
		return () => {
			dispatch(clearCurrentSeries())
		}
	}, [dispatch, id, activeProfileId])

	useEffect(() => {
		if (series) {
			const name = (i18n.language === 'es' && series.spanishTranslation?.title) || series.title
			document.title = `${name} — Jellywatch`
		}
		return () => {
			document.title = 'Jellywatch'
		}
	}, [series, i18n.language])

	useEffect(() => {
		if (!showMenu) return
		const handler = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [showMenu])

	useEffect(() => {
		if (!datePickerTarget) return
		const handler = (e: MouseEvent) => {
			if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
				setDatePickerTarget(null)
				setCustomDate('')
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [datePickerTarget])

	const handleDatePickerOption = (option: 'now' | 'custom', date?: string) => {
		if (!datePickerTarget) return
		const ts =
			option === 'now' ? new Date().toISOString() : date ? new Date(date).toISOString() : undefined
		if (!ts) return
		if (datePickerTarget.type === 'season') {
			handleSeasonState(datePickerTarget.seasonId, WatchState.Seen, ts)
		} else {
			handleSeriesState(WatchState.Seen, ts)
		}
		setDatePickerTarget(null)
		setCustomDate('')
	}

	const toggleSeason = (seasonId: number) => {
		setExpandedSeasons((prev) => {
			const next = new Set(prev)
			if (next.has(seasonId)) {
				next.delete(seasonId)
			} else {
				next.add(seasonId)
			}
			return next
		})
	}

	const handleEpisodeToggle = async (
		episodeId: number,
		newState: WatchState,
		timestamp?: string
	) => {
		if (!activeProfileId) return
		const newWatchedAt =
			newState === WatchState.Seen ? (timestamp ?? new Date().toISOString()) : null
		dispatch(updateEpisodeWatchState({ episodeId, state: newState, watchedAt: newWatchedAt }))
		dispatch(invalidateCache())
		await updateEpisodeState(activeProfileId, episodeId, { state: newState, timestamp })
	}

	const handleSeasonState = async (seasonId: number, state: WatchState, timestamp?: string) => {
		if (!activeProfileId || !series) return
		dispatch(updateSeasonWatchStates({ seasonId, state }))
		dispatch(invalidateCache())
		await setSeasonState(activeProfileId, seasonId, state, timestamp)
	}

	const handleSeasonWontWatch = async (seasonId: number) => {
		if (!activeProfileId || !series) return
		const season = series.seasons.find((s) => s.id === seasonId)
		if (!season) return
		const allWontWatch = season.episodes.every((ep) => ep.state === WatchState.WontWatch)
		const newState = allWontWatch ? WatchState.Unseen : WatchState.WontWatch
		dispatch(updateSeasonWatchStates({ seasonId, state: newState }))
		dispatch(invalidateCache())
		await setSeasonState(activeProfileId, seasonId, newState)
	}

	const handleSeriesState = async (state: WatchState, timestamp?: string) => {
		if (!activeProfileId || !series) return
		dispatch(updateAllWatchStates(state))
		dispatch(invalidateCache())
		await setSeriesAllState(activeProfileId, series.id, state, timestamp)
	}

	const handleRate = async (rating: number | null) => {
		if (!activeProfileId || !series) return
		setSavingRating(true)
		dispatch(updateSeriesRating(rating))
		dispatch(invalidateCache())
		await rateSeries(series.id, activeProfileId, rating)
		setSavingRating(false)
	}

	const handleRateEpisode = async (episodeId: number, rating: number | null) => {
		if (!activeProfileId || !series) return
		dispatch(updateEpisodeRating({ episodeId, rating }))
		await rateEpisode(series.id, episodeId, activeProfileId, rating)
	}

	const handleRateSeason = async (seasonId: number, rating: number | null) => {
		if (!activeProfileId || !series) return
		dispatch(updateSeasonRating({ seasonId, rating }))
		await rateSeason(series.id, seasonId, activeProfileId, rating)
	}

	const handleDelete = async () => {
		if (!series) return
		try {
			await deleteMediaItem(series.mediaItemId)
			navigate('/series')
		} catch {
			// Forbidden for non-admins — button is hidden anyway
		}
	}

	const handleRemoveFromList = async () => {
		if (!activeProfileId || !series) return
		await removeMediaFromProfile(activeProfileId, series.mediaItemId)
		navigate('/series')
	}

	const handleBlock = async () => {
		if (!activeProfileId || !series) return
		await blockMediaForProfile(activeProfileId, series.mediaItemId)
		navigate('/series')
	}

	const handleUnblock = async () => {
		if (!activeProfileId || !series) return
		await unblockMediaForProfile(activeProfileId, series.mediaItemId)
		if (id) dispatch(fetchSeriesById({ id: Number(id), profileId: activeProfileId }))
	}

	const handleAddToLibrary = async () => {
		if (!activeProfileId || !series || !series.tmdbId) return
		setIsAddingToLibrary(true)
		try {
			await addManually({ tmdbId: series.tmdbId, type: 'series', profileId: activeProfileId })
			if (id) dispatch(fetchSeriesById({ id: Number(id), profileId: activeProfileId }))
		} catch {
			// silently ignore
		} finally {
			setIsAddingToLibrary(false)
		}
	}

	const handleRefreshMetadata = async () => {
		if (!series) return
		setRefreshing(true)
		try {
			await refreshMediaItem(series.mediaItemId, undefined, false)
			if (id) dispatch(fetchSeriesById({ id: Number(id), profileId: activeProfileId }))
		} catch {
			// Forbidden for non-admins — button is hidden anyway
		} finally {
			setRefreshing(false)
		}
	}

	const handleRefreshImages = async () => {
		if (!series) return
		setRefreshingImages(true)
		try {
			await refreshMediaItem(series.mediaItemId, undefined, true)
			setShowPosterPicker(true)
		} catch {
			// Forbidden for non-admins — button is hidden anyway
		} finally {
			setRefreshingImages(false)
		}
	}

	const handlePosterPickerClose = () => {
		setShowPosterPicker(false)
	}

	const handlePosterSelected = () => {
		setShowPosterPicker(false)
		setPosterVersion((v) => v + 1)
		if (id) dispatch(fetchSeriesById({ id: Number(id), profileId: activeProfileId }))
	}

	const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file || !series) return
		try {
			setUploadError(null)
			await uploadCustomPoster(series.mediaItemId, file)
			setPosterVersion((v) => v + 1)
			if (id) dispatch(fetchSeriesById({ id: Number(id), profileId: activeProfileId }))
		} catch (err) {
			setUploadError(err instanceof Error ? err.message : t('common.error'))
		} finally {
			e.target.value = ''
		}
	}

	if (loading) {
		return <div className='loading-state'>{t('common.loading')}</div>
	}

	if (error || !series) {
		return (
			<div className='error-state'>
				<p>{error || t('common.error')}</p>
				<Link to='/series'>{t('common.back')}</Link>
			</div>
		)
	}

	const useSpanish = i18n.language === 'es' && series.spanishTranslation
	const title =
		(i18n.language === 'es'
			? series.spanishTranslation?.title || series.originalTitle || null
			: null) || series.title
	const overview = (useSpanish ? series.spanishTranslation?.overview : null) ?? series.overview

	return (
		<div className='series-detail'>
			<div className='series-detail__back'>
				<Link to='/series'>← {t('common.back')}</Link>
			</div>

			<div className='series-detail__hero'>
				<div className='series-detail__poster-wrap'>
					<MediaPoster
						mediaItemId={series.mediaItemId}
						alt={title}
						className='series-detail__poster'
						fallback='📺'
						cacheBust={posterVersion}
					/>
					{uploadError && <p className='series-detail__upload-error'>{uploadError}</p>}
				</div>
				<div className='series-detail__info'>
					<div className='series-detail__title-row'>
						<h1>{title}</h1>
						<div style={{ display: 'flex' }}>
							{activeProfileId && !series.isInLibrary && (
								<button
									className='series-detail__add-btn'
									onClick={handleAddToLibrary}
									disabled={isAddingToLibrary}>
									{isAddingToLibrary ? t('common.loading') : `+ ${t('common.add')}`}
								</button>
							)}
							{activeProfileId && (
								<div className='series-detail__admin-menu-wrap' ref={menuRef}>
									<input
										ref={posterInputRef}
										type='file'
										accept='image/jpeg,image/png,image/webp'
										style={{ display: 'none' }}
										onChange={handlePosterUpload}
									/>
									<button
										className='series-detail__menu-btn'
										onClick={() => setShowMenu((v) => !v)}
										title='More options'>
										<svg viewBox='0 0 24 24' width='16' height='16' fill='currentColor'>
											<circle cx='5' cy='12' r='2' />
											<circle cx='12' cy='12' r='2' />
											<circle cx='19' cy='12' r='2' />
										</svg>
									</button>
									{showMenu && (
										<div className='series-detail__admin-menu'>
											{isAdmin && (
												<button
													onClick={() => {
														setShowPosterPicker(true)
														setShowMenu(false)
													}}>
													{t('admin.pickPoster')}
												</button>
											)}
											{series.isInLibrary && (
												<button
													onClick={() => {
														setShowConfirmRemove(true)
														setShowMenu(false)
													}}>
													{t('admin.removeFromList')}
												</button>
											)}
											{isAdmin && (
												<>
													<button
														onClick={() => {
															posterInputRef.current?.click()
															setShowMenu(false)
														}}>
														{t('series.uploadPoster')}
													</button>
													<button
														onClick={() => {
															handleRefreshImages()
															setShowMenu(false)
														}}
														disabled={refreshing || refreshingImages}>
														{refreshingImages
															? t('admin.refreshingMedia')
															: t('admin.refreshImages')}
													</button>
													<button
														onClick={() => {
															handleRefreshMetadata()
															setShowMenu(false)
														}}
														disabled={refreshing || refreshingImages}>
														{refreshing ? t('admin.refreshingMedia') : t('admin.refreshMedia')}
													</button>
												</>
											)}
											<div className='series-detail__admin-menu__separator' />
											{series.isBlocked ? (
												<button
													className='series-detail__admin-menu__delete'
													onClick={async () => {
														setShowMenu(false)
														await handleUnblock()
													}}>
													{t('admin.unblockMedia')}
												</button>
											) : (
												<button
													className='series-detail__admin-menu__delete'
													onClick={() => {
														setShowConfirmBlock(true)
														setShowMenu(false)
													}}>
													{t('admin.blockMedia')}
												</button>
											)}
											{isAdmin && (
												<button
													className='series-detail__admin-menu__delete'
													onClick={() => {
														setShowConfirmDelete(true)
														setShowMenu(false)
													}}>
													{t('admin.deleteMedia')}
												</button>
											)}
										</div>
									)}
								</div>
							)}
						</div>
					</div>
					{series.originalTitle && series.originalTitle !== title && (
						<p className='series-detail__original'>{series.originalTitle}</p>
					)}
					<div className='series-detail__meta'>
						{series.releaseDate && <span>{new Date(series.releaseDate).getFullYear()}</span>}
						{series.status && <span>{series.status}</span>}
						{series.network && <span>{series.network}</span>}
						{series.totalSeasons != null && (
							<span>
								{series.totalSeasons} {t('series.seasons')}
							</span>
						)}
					</div>
					{series.genres && (
						<div className='series-detail__genres'>
							{series.genres.split(',').map((g) => (
								<span key={g.trim()} className='series-detail__genre-tag'>
									{g.trim()}
								</span>
							))}
						</div>
					)}

					{series.ratings.length > 0 && <RatingDisplay ratings={series.ratings} />}
					<div className='series-detail__user-rating'>
						<StarRating
							value={series.userRating ?? null}
							onChange={handleRate}
							saving={savingRating}
						/>
					</div>
					{overview && <p className='series-detail__overview'>{overview}</p>}
				</div>
			</div>

			<div className='series-detail__seasons'>
				<div className='series-detail__seasons-header'>
					<h2>{t('series.seasons')}</h2>
					{activeProfileId &&
						(() => {
							const allSeriesComplete =
								series.seasons.length > 0 &&
								series.seasons.every(
									(s: SeasonDto) =>
										s.episodes.length > 0 &&
										s.episodes.every(
											(ep) => ep.state === WatchState.Seen || ep.state === WatchState.WontWatch
										)
								)
							return (
								<span className='series-detail__seasons-actions'>
									<button
										className={`season-bulk-btn season-bulk-btn--${allSeriesComplete ? 'unseen' : 'seen'}`}
										onClick={() =>
											handleSeriesState(allSeriesComplete ? WatchState.Unseen : WatchState.Seen)
										}
										title={
											allSeriesComplete
												? t('watchState.markAllUnseen')
												: t('watchState.markAllSeen')
										}>
										{allSeriesComplete ? (
											<svg
												viewBox='0 0 24 24'
												width='13'
												height='13'
												fill='none'
												stroke='currentColor'
												strokeWidth='2.5'
												strokeLinecap='round'
												strokeLinejoin='round'>
												<line x1='18' y1='6' x2='6' y2='18' />
												<line x1='6' y1='6' x2='18' y2='18' />
											</svg>
										) : (
											<svg
												viewBox='0 0 24 24'
												width='13'
												height='13'
												fill='none'
												stroke='currentColor'
												strokeWidth='2.5'
												strokeLinecap='round'
												strokeLinejoin='round'>
												<polyline points='20 6 9 17 4 12' />
											</svg>
										)}
									</button>
									{!allSeriesComplete && (
										<div
											className='series-detail__date-wrap'
											ref={datePickerTarget?.type === 'series' ? datePickerRef : undefined}>
											<button
												className='series-detail__date-trigger'
												onClick={() =>
													setDatePickerTarget(
														datePickerTarget?.type === 'series' ? null : { type: 'series' }
													)
												}
												title={t('episodeToggle.watchedAt')}>
												<CalendarIcon />
											</button>
											{datePickerTarget?.type === 'series' && (
												<div className='series-detail__date-menu'>
													<button
														className='series-detail__date-option'
														onClick={() => handleDatePickerOption('now')}>
														{t('episodeToggle.watchedNow')}
													</button>
													{customDate === '' ? (
														<button
															className='series-detail__date-option'
															onClick={() => setCustomDate(' ')}>
															{t('episodeToggle.watchedCustom')}
														</button>
													) : (
														<div className='series-detail__custom-date'>
															<input
																type='date'
																value={customDate.trim()}
																onChange={(e) => setCustomDate(e.target.value)}
																autoFocus
															/>
															<button
																className='series-detail__date-option series-detail__date-option--confirm'
																onClick={() => handleDatePickerOption('custom', customDate.trim())}
																disabled={!customDate.trim()}>
																{t('common.confirm')}
															</button>
														</div>
													)}
												</div>
											)}
										</div>
									)}
								</span>
							)
						})()}
				</div>
				{series.seasons.map((season: SeasonDto) => (
					<div key={season.id} className='season-block'>
						<div
							className={`season-header ${expandedSeasons.has(season.id) ? 'season-header--expanded' : ''}`}
							role='button'
							tabIndex={0}
							onClick={() => toggleSeason(season.id)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') toggleSeason(season.id)
							}}>
							<div className='season-header__poster-slot'>
								{season.posterUrl ? (
									<img
										className='season-header__poster'
										src={season.posterUrl}
										alt={season.name ?? ''}
										loading='lazy'
									/>
								) : (
									<div className='season-header__poster-placeholder' />
								)}
							</div>
							<div className='season-header__info'>
								<span className='season-header__title'>
									{season.name || t('series.season', { number: season.seasonNumber })}
									{season.airDate && (
										<span className='season-header__year'>
											{new Date(season.airDate).getFullYear()}
										</span>
									)}
									{season.tmdbRating != null && season.tmdbRating > 0 && (
										<span className='season-header__tmdb-rating'>
											{season.tmdbRating.toFixed(1)}
										</span>
									)}
								</span>
								<span className='season-header__progress'>
									{season.episodesSeen}/{season.episodeCount ?? '?'} {t('series.episodes')}
								</span>
							</div>
							{season.userRating != null && (
								<span className='season-header__user-rating'>★ {season.userRating / 2}</span>
							)}
							{activeProfileId &&
								(() => {
									const seasonAllComplete =
										season.episodes.length > 0 &&
										season.episodes.every(
											(ep) => ep.state === WatchState.Seen || ep.state === WatchState.WontWatch
										)
									const allWontWatch =
										season.episodes.length > 0 &&
										season.episodes.every((ep) => ep.state === WatchState.WontWatch)
									return (
										<span className='season-header__actions' onClick={(e) => e.stopPropagation()}>
											<button
												className={`season-bulk-btn season-bulk-btn--${seasonAllComplete ? 'seen' : 'unseen'}`}
												onClick={(e) => {
													e.stopPropagation()
													handleSeasonState(
														season.id,
														seasonAllComplete ? WatchState.Unseen : WatchState.Seen
													)
												}}
												title={
													seasonAllComplete
														? t('watchState.markSeasonUnseen')
														: t('watchState.markSeasonSeen')
												}>
												<svg
													viewBox='0 0 24 24'
													width='11'
													height='11'
													fill='none'
													stroke='currentColor'
													strokeWidth='2.5'
													strokeLinecap='round'
													strokeLinejoin='round'>
													<polyline points='20 6 9 17 4 12' />
												</svg>
											</button>
											{!seasonAllComplete && (
												<div
													className='series-detail__date-wrap series-detail__date-wrap--season'
													ref={
														datePickerTarget?.type === 'season' &&
														datePickerTarget.seasonId === season.id
															? datePickerRef
															: undefined
													}>
													<button
														className='series-detail__date-trigger series-detail__date-trigger--small'
														onClick={(e) => {
															e.stopPropagation()
															setDatePickerTarget(
																datePickerTarget?.type === 'season' &&
																	datePickerTarget.seasonId === season.id
																	? null
																	: { type: 'season', seasonId: season.id }
															)
															setCustomDate('')
														}}
														title={t('episodeToggle.watchedAt')}>
														<CalendarIcon />
													</button>
													{datePickerTarget?.type === 'season' &&
														datePickerTarget.seasonId === season.id && (
															<div className='series-detail__date-menu'>
																<button
																	className='series-detail__date-option'
																	onClick={(e) => {
																		e.stopPropagation()
																		handleDatePickerOption('now')
																	}}>
																	{t('episodeToggle.watchedNow')}
																</button>
																{customDate === '' ? (
																	<button
																		className='series-detail__date-option'
																		onClick={(e) => {
																			e.stopPropagation()
																			setCustomDate(' ')
																		}}>
																		{t('episodeToggle.watchedCustom')}
																	</button>
																) : (
																	<div
																		className='series-detail__custom-date'
																		onClick={(e) => e.stopPropagation()}>
																		<input
																			type='date'
																			value={customDate.trim()}
																			onChange={(e) => setCustomDate(e.target.value)}
																			autoFocus
																		/>
																		<button
																			className='series-detail__date-option series-detail__date-option--confirm'
																			onClick={() =>
																				handleDatePickerOption('custom', customDate.trim())
																			}
																			disabled={!customDate.trim()}>
																			{t('common.confirm')}
																		</button>
																	</div>
																)}
															</div>
														)}
												</div>
											)}
											<button
												className={`season-bulk-btn season-bulk-btn--skip${allWontWatch ? ' season-bulk-btn--skip-active' : ''}`}
												onClick={(e) => {
													e.stopPropagation()
													handleSeasonWontWatch(season.id)
												}}
												title='Skip season'>
												<svg
													viewBox='0 0 24 24'
													width='11'
													height='11'
													fill='none'
													stroke='currentColor'
													strokeWidth='2.5'
													strokeLinecap='round'
													strokeLinejoin='round'>
													<line x1='18' y1='6' x2='6' y2='18' />
													<line x1='6' y1='6' x2='18' y2='18' />
												</svg>
											</button>
										</span>
									)
								})()}
							<span className='season-header__chevron'>
								{expandedSeasons.has(season.id) ? '▾' : '▸'}
							</span>
						</div>

						{expandedSeasons.has(season.id) && (
							<div className='season-episodes'>
								<div className='season-episodes__header' onClick={(e) => e.stopPropagation()}>
									<StarRating
										value={season.userRating ?? null}
										onChange={(r) => handleRateSeason(season.id, r)}
										label={`${t('series.season', { number: season.seasonNumber })}:`}
									/>
								</div>
								{season.episodes.map((ep) => (
									<div key={ep.id} className='episode-row'>
										<EpisodeToggle
											state={ep.state}
											isManualOverride={ep.isManualOverride}
											onToggle={(newState, timestamp) =>
												handleEpisodeToggle(ep.id, newState, timestamp)
											}
											airDate={ep.airDate}
										/>
										<div className='episode-row__still-slot'>
											{ep.stillUrl ? (
												<img
													className='episode-row__still'
													src={ep.stillUrl}
													alt={ep.name ?? ''}
													loading='lazy'
												/>
											) : (
												<div className='episode-row__still-placeholder' />
											)}
										</div>
										<span className='episode-row__number'>
											{t('series.episode', { number: ep.episodeNumber })}
										</span>
										<span className='episode-row__name'>
											{ep.name ?? ''}
											{ep.watchedAt && (
												<span className='episode-row__watched-at'>
													{(() => {
														const d = new Date(ep.watchedAt)
														return `${d.getDate()} ${d.toLocaleDateString(i18n.language, { month: 'short' })}, ${d.getFullYear()}`
													})()}
												</span>
											)}
										</span>
										{ep.airDate && (
											<span className='episode-row__air-date'>
												{(() => {
													const d = new Date(ep.airDate + 'T12:00:00')
													return `${d.getDate()} ${d.toLocaleDateString(i18n.language, { month: 'short' })}, ${d.getFullYear()}`
												})()}
											</span>
										)}
										{ep.tmdbRating != null && (
											<span className='episode-row__tmdb-rating' title='TMDB'>
												★ {ep.tmdbRating.toFixed(1)}
											</span>
										)}
										<span className='episode-row__rating' onClick={(e) => e.stopPropagation()}>
											<StarRating
												value={ep.userRating ?? null}
												onChange={(r) => handleRateEpisode(ep.id, r)}
											/>
										</span>
										<WatchStateBadge state={ep.state} size='sm' />
									</div>
								))}
							</div>
						)}
					</div>
				))}
			</div>

			<CastSection fetchCredits={() => getSeriesCredits(series.id)} mediaId={series.id} />

			{showPosterPicker && series && (
				<PosterPickerModal
					mediaItemId={series.mediaItemId}
					type='poster'
					onClose={handlePosterPickerClose}
					onSelected={handlePosterSelected}
				/>
			)}
			{showLogoPicker && series && (
				<PosterPickerModal
					mediaItemId={series.mediaItemId}
					type='logo'
					onClose={() => setShowLogoPicker(false)}
					onSelected={() => setShowLogoPicker(false)}
				/>
			)}
			{showConfirmDelete && (
				<div className='confirm-modal-overlay'>
					<div className='confirm-modal'>
						<p>{t('admin.confirmDelete', { title })}</p>
						<div className='confirm-modal__actions'>
							<button className='btn-secondary' onClick={() => setShowConfirmDelete(false)}>
								{t('common.cancel')}
							</button>
							<button
								className='btn-secondary'
								onClick={async () => {
									setShowConfirmDelete(false)
									await handleDelete()
								}}>
								{t('admin.deleteMedia')}
							</button>
						</div>
					</div>
				</div>
			)}
			{showConfirmRemove && (
				<div className='confirm-modal-overlay'>
					<div className='confirm-modal'>
						<p>{t('admin.confirmRemoveFromList', { title })}</p>
						<div className='confirm-modal__actions'>
							<button className='btn-secondary' onClick={() => setShowConfirmRemove(false)}>
								{t('common.cancel')}
							</button>
							<button
								className='btn-secondary'
								onClick={async () => {
									setShowConfirmRemove(false)
									await handleRemoveFromList()
								}}>
								{t('admin.removeFromList')}
							</button>
						</div>
					</div>
				</div>
			)}
			{showConfirmBlock && (
				<div className='confirm-modal-overlay'>
					<div className='confirm-modal'>
						<p>{t('admin.confirmBlockMedia', { title })}</p>
						<div className='confirm-modal__actions'>
							<button className='btn-secondary' onClick={() => setShowConfirmBlock(false)}>
								{t('common.cancel')}
							</button>
							<button
								className='series-detail__admin-menu__delete btn-secondary'
								onClick={async () => {
									setShowConfirmBlock(false)
									await handleBlock()
								}}>
								{t('admin.blockMedia')}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default SeriesDetail
