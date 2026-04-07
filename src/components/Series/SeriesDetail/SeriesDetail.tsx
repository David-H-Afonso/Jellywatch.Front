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
} from '@/services/MediaService/MediaService'
import { deleteMediaItem, refreshMediaItem } from '@/services/AdminService/AdminService'
import type { SeasonDto } from '@/models/api'
import './SeriesDetail.scss'

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
	const posterInputRef = useRef<HTMLInputElement>(null)
	const adminMenuRef = useRef<HTMLDivElement>(null)
	const [showAdminMenu, setShowAdminMenu] = useState(false)
	const [showConfirmDelete, setShowConfirmDelete] = useState(false)

	useEffect(() => {
		if (id) {
			dispatch(fetchSeriesById({ id: Number(id), profileId: activeProfileId }))
		}
		return () => {
			dispatch(clearCurrentSeries())
		}
	}, [dispatch, id, activeProfileId])

	useEffect(() => {
		if (!showAdminMenu) return
		const handler = (e: MouseEvent) => {
			if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node))
				setShowAdminMenu(false)
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [showAdminMenu])

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

	const handleEpisodeToggle = async (episodeId: number, newState: WatchState) => {
		if (!activeProfileId) return
		dispatch(updateEpisodeWatchState({ episodeId, state: newState }))
		dispatch(invalidateCache())
		await updateEpisodeState(activeProfileId, episodeId, { state: newState })
	}

	const handleSeasonState = async (seasonId: number, state: WatchState) => {
		if (!activeProfileId || !series) return
		dispatch(updateSeasonWatchStates({ seasonId, state }))
		dispatch(invalidateCache())
		await setSeasonState(activeProfileId, seasonId, state)
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

	const handleSeriesState = async (state: WatchState) => {
		if (!activeProfileId || !series) return
		dispatch(updateAllWatchStates(state))
		dispatch(invalidateCache())
		await setSeriesAllState(activeProfileId, series.id, state)
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
		if (id) dispatch(fetchSeriesById({ id: Number(id), profileId: activeProfileId }))
	}

	const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file || !series) return
		try {
			setUploadError(null)
			await uploadCustomPoster(series.mediaItemId, file)
			// Force browser to reload the poster image by busting the cache
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
	const title = (useSpanish ? series.spanishTranslation?.title : null) ?? series.title
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
					/>
					{uploadError && <p className='series-detail__upload-error'>{uploadError}</p>}
				</div>
				<div className='series-detail__info'>
					<div className='series-detail__title-row'>
						<h1>{title}</h1>
						{isAdmin && (
							<div className='series-detail__admin-menu-wrap' ref={adminMenuRef}>
								<input
									ref={posterInputRef}
									type='file'
									accept='image/jpeg,image/png,image/webp'
									style={{ display: 'none' }}
									onChange={handlePosterUpload}
								/>
								<button
									className='series-detail__menu-btn'
									onClick={() => setShowAdminMenu((v) => !v)}
									title='More options'>
									<svg viewBox='0 0 24 24' width='16' height='16' fill='currentColor'>
										<circle cx='5' cy='12' r='2' />
										<circle cx='12' cy='12' r='2' />
										<circle cx='19' cy='12' r='2' />
									</svg>
								</button>
								{showAdminMenu && (
									<div className='series-detail__admin-menu'>
										<button
											onClick={() => {
												setShowPosterPicker(true)
												setShowAdminMenu(false)
											}}>
											{t('admin.pickPoster')}
										</button>
										<button
											onClick={() => {
												posterInputRef.current?.click()
												setShowAdminMenu(false)
											}}>
											{t('series.uploadPoster')}
										</button>
										<button
											onClick={() => {
												handleRefreshImages()
												setShowAdminMenu(false)
											}}
											disabled={refreshing || refreshingImages}>
											{refreshingImages ? t('admin.refreshingMedia') : t('admin.refreshImages')}
										</button>
										<button
											onClick={() => {
												handleRefreshMetadata()
												setShowAdminMenu(false)
											}}
											disabled={refreshing || refreshingImages}>
											{refreshing ? t('admin.refreshingMedia') : t('admin.refreshMedia')}
										</button>
										<button
											className='series-detail__admin-menu__delete'
											onClick={() => {
												setShowConfirmDelete(true)
												setShowAdminMenu(false)
											}}>
											{t('admin.deleteMedia')}
										</button>
									</div>
								)}
							</div>
						)}
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
								<button
									className={`season-bulk-btn season-bulk-btn--${allSeriesComplete ? 'unseen' : 'seen'}`}
									onClick={() =>
										handleSeriesState(allSeriesComplete ? WatchState.Unseen : WatchState.Seen)
									}
									title={
										allSeriesComplete ? t('watchState.markAllUnseen') : t('watchState.markAllSeen')
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
											onToggle={(newState) => handleEpisodeToggle(ep.id, newState)}
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
										<span className='episode-row__name'>{ep.name ?? ''}</span>
										{ep.tmdbRating != null && (
											<span className='episode-row__tmdb-rating' title='TMDB'>
												⭐ {ep.tmdbRating.toFixed(1)}
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
		</div>
	)
}

export default SeriesDetail
