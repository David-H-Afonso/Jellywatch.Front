import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectActiveProfileId, selectIsAdmin } from '@/store/features/auth/selector'
import {
	selectCurrentMovie,
	selectMoviesLoading,
	selectMoviesError,
	fetchMovieById,
	clearCurrentMovie,
} from '@/store/features/movies'
import {
	RatingDisplay,
	MediaPoster,
	WatchStateBadge,
	StarRating,
	PosterPickerModal,
	CastSection,
} from '@/components/elements'
import { WatchState } from '@/models/api/Enums'
import {
	updateMovieState,
	rateMovie,
	uploadCustomPoster,
	getMovieCredits,
} from '@/services/MediaService/MediaService'
import { deleteMediaItem, refreshMediaItem } from '@/services/AdminService/AdminService'
import {
	removeMediaFromProfile,
	blockMediaForProfile,
	unblockMediaForProfile,
} from '@/services/ProfileService/ProfileService'
import './MovieDetail.scss'

const CalendarIcon = () => (
	<svg viewBox='0 0 24 24' width='12' height='12' fill='currentColor' opacity='.6'>
		<path d='M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z' />
	</svg>
)

const MovieDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>()
	const { t, i18n } = useTranslation()
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const movie = useAppSelector(selectCurrentMovie)
	const loading = useAppSelector(selectMoviesLoading)
	const error = useAppSelector(selectMoviesError)
	const activeProfileId = useAppSelector(selectActiveProfileId)
	const isAdmin = useAppSelector(selectIsAdmin)
	const [savingRating, setSavingRating] = useState(false)
	const [uploadError, setUploadError] = useState<string | null>(null)
	const [refreshing, setRefreshing] = useState(false)
	const [refreshingImages, setRefreshingImages] = useState(false)
	const [showPosterPicker, setShowPosterPicker] = useState(false)
	const [posterVersion, setPosterVersion] = useState(0)
	const posterInputRef = useRef<HTMLInputElement>(null)
	const [showConfirmDelete, setShowConfirmDelete] = useState(false)
	const [showDateMenu, setShowDateMenu] = useState(false)
	const [showCustomDate, setShowCustomDate] = useState(false)
	const [customDate, setCustomDate] = useState('')
	const [showConfirmRemove, setShowConfirmRemove] = useState(false)
	const [showConfirmBlock, setShowConfirmBlock] = useState(false)
	const dateMenuRef = useRef<HTMLDivElement>(null)
	const menuRef = useRef<HTMLDivElement>(null)
	const [showMenu, setShowMenu] = useState(false)

	const closeDateMenu = useCallback(() => {
		setShowDateMenu(false)
		setShowCustomDate(false)
		setCustomDate('')
	}, [])

	useEffect(() => {
		if (!showMenu) return
		const handler = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [showMenu])

	useEffect(() => {
		if (!showDateMenu) return
		const handler = (e: MouseEvent) => {
			if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) closeDateMenu()
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [showDateMenu, closeDateMenu])

	useEffect(() => {
		if (id) {
			dispatch(fetchMovieById({ id: Number(id), profileId: activeProfileId }))
		}
		return () => {
			dispatch(clearCurrentMovie())
		}
	}, [dispatch, id, activeProfileId])

	useEffect(() => {
		if (movie) {
			const name = (i18n.language === 'es' && movie.spanishTranslation?.title) || movie.title
			document.title = `${name} — Jellywatch`
		}
		return () => {
			document.title = 'Jellywatch'
		}
	}, [movie, i18n.language])

	const handleStateToggle = async (timestamp?: string) => {
		if (!activeProfileId || !movie) return
		const newState = movie.state === WatchState.Seen ? WatchState.Unseen : WatchState.Seen
		const ts = newState === WatchState.Seen ? (timestamp ?? new Date().toISOString()) : timestamp
		await updateMovieState(activeProfileId, movie.id, { state: newState, timestamp: ts })
		if (id) dispatch(fetchMovieById({ id: Number(id), profileId: activeProfileId }))
	}

	const handleDateOption = (option: 'now' | 'release' | 'custom') => {
		if (option === 'now') {
			handleStateToggle(new Date().toISOString())
			closeDateMenu()
		} else if (option === 'release' && movie?.releaseDate) {
			handleStateToggle(new Date(movie.releaseDate).toISOString())
			closeDateMenu()
		} else if (option === 'custom') {
			setShowCustomDate(true)
		}
	}

	const handleCustomDateConfirm = () => {
		if (customDate) {
			handleStateToggle(new Date(customDate).toISOString())
		}
		closeDateMenu()
	}

	const handleRate = async (rating: number | null) => {
		if (!activeProfileId || !movie) return
		setSavingRating(true)
		await rateMovie(movie.id, activeProfileId, rating)
		if (id) dispatch(fetchMovieById({ id: Number(id), profileId: activeProfileId }))
		setSavingRating(false)
	}

	const handleRemoveFromList = async () => {
		if (!activeProfileId || !movie) return
		await removeMediaFromProfile(activeProfileId, movie.mediaItemId)
		navigate('/movies')
	}

	const handleDelete = async () => {
		if (!movie) return
		try {
			await deleteMediaItem(movie.mediaItemId)
			navigate('/movies')
		} catch {
			// Forbidden for non-admins — button is hidden anyway
		}
	}

	const handleRefreshMetadata = async () => {
		if (!movie) return
		setRefreshing(true)
		try {
			await refreshMediaItem(movie.mediaItemId, undefined, false)
			if (id) dispatch(fetchMovieById({ id: Number(id), profileId: activeProfileId }))
		} catch {
			// Forbidden for non-admins — button is hidden anyway
		} finally {
			setRefreshing(false)
		}
	}

	const handleRefreshImages = async () => {
		if (!movie) return
		setRefreshingImages(true)
		try {
			await refreshMediaItem(movie.mediaItemId, undefined, true)
			setShowPosterPicker(true)
		} catch {
			// Forbidden for non-admins — button is hidden anyway
		} finally {
			setRefreshingImages(false)
		}
	}

	const handlePosterSelected = () => {
		setShowPosterPicker(false)
		setPosterVersion((v) => v + 1)
		if (id) dispatch(fetchMovieById({ id: Number(id), profileId: activeProfileId }))
	}

	const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file || !movie) return
		try {
			setUploadError(null)
			await uploadCustomPoster(movie.mediaItemId, file)
			setPosterVersion((v) => v + 1)
			if (id) dispatch(fetchMovieById({ id: Number(id), profileId: activeProfileId }))
		} catch (err) {
			setUploadError(err instanceof Error ? err.message : t('common.error'))
		} finally {
			e.target.value = ''
		}
	}

	const handleBlock = async () => {
		if (!activeProfileId || !movie) return
		await blockMediaForProfile(activeProfileId, movie.mediaItemId)
		navigate('/movies')
	}

	const handleUnblock = async () => {
		if (!activeProfileId || !movie) return
		await unblockMediaForProfile(activeProfileId, movie.mediaItemId)
		if (id) dispatch(fetchMovieById({ id: Number(id), profileId: activeProfileId }))
	}

	if (loading) {
		return <div className='loading-state'>{t('common.loading')}</div>
	}

	if (error || !movie) {
		return (
			<div className='error-state'>
				<p>{error || t('common.error')}</p>
				<Link to='/movies'>{t('common.back')}</Link>
			</div>
		)
	}

	const useSpanish = i18n.language === 'es' && movie.spanishTranslation
	const title =
		(i18n.language === 'es'
			? movie.spanishTranslation?.title || movie.originalTitle || null
			: null) || movie.title
	const overview = (useSpanish ? movie.spanishTranslation?.overview : null) ?? movie.overview

	return (
		<div className='movie-detail'>
			<div className='movie-detail__back'>
				<Link to='/movies'>← {t('common.back')}</Link>
			</div>

			<div className='movie-detail__hero'>
				<div className='movie-detail__poster-wrap'>
					<MediaPoster
						mediaItemId={movie.mediaItemId}
						alt={title}
						className='movie-detail__poster'
						fallback='🎬'
						cacheBust={posterVersion}
					/>
					{uploadError && <p className='movie-detail__upload-error'>{uploadError}</p>}
				</div>
				<div className='movie-detail__info'>
					<div className='movie-detail__title-row'>
						<h1>{title}</h1>
						<WatchStateBadge state={movie.state} />
						{activeProfileId && (
							<div className='movie-detail__admin-menu-wrap' ref={menuRef}>
								<input
									ref={posterInputRef}
									type='file'
									accept='image/jpeg,image/png,image/webp'
									style={{ display: 'none' }}
									onChange={handlePosterUpload}
								/>
								<button
									className='movie-detail__menu-btn'
									onClick={() => setShowMenu((v) => !v)}
									title='More options'>
									<svg viewBox='0 0 24 24' width='16' height='16' fill='currentColor'>
										<circle cx='5' cy='12' r='2' />
										<circle cx='12' cy='12' r='2' />
										<circle cx='19' cy='12' r='2' />
									</svg>
								</button>
								{showMenu && (
									<div className='movie-detail__admin-menu'>
										{isAdmin && (
											<button
												onClick={() => {
													setShowPosterPicker(true)
													setShowMenu(false)
												}}>
												{t('admin.pickPoster')}
											</button>
										)}
										<button
											onClick={() => {
												setShowConfirmRemove(true)
												setShowMenu(false)
											}}>
											{t('admin.removeFromList')}
										</button>
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
													{refreshingImages ? t('admin.refreshingMedia') : t('admin.refreshImages')}
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
										<div className='movie-detail__admin-menu__separator' />
										{movie.isBlocked ? (
											<button
												className='movie-detail__admin-menu__delete'
												onClick={async () => {
													setShowMenu(false)
													await handleUnblock()
												}}>
												{t('admin.unblockMedia')}
											</button>
										) : (
											<button
												className='movie-detail__admin-menu__delete'
												onClick={() => {
													setShowConfirmBlock(true)
													setShowMenu(false)
												}}>
												{t('admin.blockMedia')}
											</button>
										)}
										{isAdmin && (
											<button
												className='movie-detail__admin-menu__delete'
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
					{movie.originalTitle && movie.originalTitle !== title && (
						<p className='movie-detail__original'>{movie.originalTitle}</p>
					)}
					<div className='movie-detail__meta'>
						{movie.releaseDate && <span>{new Date(movie.releaseDate).getFullYear()}</span>}
						{movie.runtime != null && (
							<span>
								{movie.runtime} {t('movies.minutes')}
							</span>
						)}
						{movie.watchedAt && (
							<span className='movie-detail__watched-at'>
								<CalendarIcon />{' '}
								{(() => {
									const d = new Date(movie.watchedAt)
									return `${d.getDate()} ${d.toLocaleDateString(i18n.language, { month: 'short' })}, ${d.getFullYear()}`
								})()}
							</span>
						)}
					</div>
					{movie.genres && (
						<div className='movie-detail__genres'>
							{movie.genres.split(',').map((g) => (
								<span key={g.trim()} className='movie-detail__genre-tag'>
									{g.trim()}
								</span>
							))}
						</div>
					)}
					{movie.ratings.length > 0 && <RatingDisplay ratings={movie.ratings} />}
					<StarRating
						value={movie.userRating ?? null}
						onChange={handleRate}
						saving={savingRating}
					/>

					<div className='movie-detail__toggle-wrap'>
						<button
							className={`movie-detail__toggle ${movie.state === WatchState.Seen ? 'movie-detail__toggle--seen' : ''}`}
							onClick={() => handleStateToggle()}>
							{movie.state === WatchState.Seen
								? t('watchState.markUnseen')
								: t('watchState.markSeen')}
						</button>
						{movie.state !== WatchState.Seen && (
							<div className='movie-detail__date-wrap' ref={dateMenuRef}>
								<button
									className='movie-detail__date-trigger'
									onClick={() => setShowDateMenu((v) => !v)}
									title={t('episodeToggle.watchedAt')}>
									<CalendarIcon />
								</button>
								{showDateMenu && (
									<div className='movie-detail__date-menu'>
										{!showCustomDate ? (
											<>
												<button
													className='movie-detail__date-option'
													onClick={() => handleDateOption('now')}>
													{t('episodeToggle.watchedNow')}
												</button>
												{movie.releaseDate && (
													<button
														className='movie-detail__date-option'
														onClick={() => handleDateOption('release')}>
														{t('episodeToggle.watchedRelease')} (
														{new Date(movie.releaseDate).toLocaleDateString()})
													</button>
												)}
												<button
													className='movie-detail__date-option'
													onClick={() => handleDateOption('custom')}>
													{t('episodeToggle.watchedCustom')}
												</button>
											</>
										) : (
											<div className='movie-detail__custom-date'>
												<input
													type='date'
													value={customDate}
													onChange={(e) => setCustomDate(e.target.value)}
													autoFocus
												/>
												<button
													className='movie-detail__date-option movie-detail__date-option--confirm'
													onClick={handleCustomDateConfirm}
													disabled={!customDate}>
													{t('common.confirm')}
												</button>
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>

					{overview && <p className='movie-detail__overview'>{overview}</p>}
				</div>
			</div>

			<CastSection fetchCredits={() => getMovieCredits(movie.id)} mediaId={movie.id} />

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
								className='movie-detail__admin-menu__delete btn-secondary'
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
			{showConfirmDelete && (
				<div className='confirm-modal-overlay'>
					<div className='confirm-modal'>
						<p>{t('admin.confirmDeleteMedia', { title })}</p>
						<div className='confirm-modal__actions'>
							<button className='btn-secondary' onClick={() => setShowConfirmDelete(false)}>
								{t('common.cancel')}
							</button>
							<button
								className='movie-detail__admin-menu__delete btn-secondary'
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
			{showPosterPicker && movie && (
				<PosterPickerModal
					mediaItemId={movie.mediaItemId}
					onClose={() => setShowPosterPicker(false)}
					onSelected={handlePosterSelected}
				/>
			)}
		</div>
	)
}

export default MovieDetail
