import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectActiveProfileId } from '@/store/features/auth/selector'
import {
	selectCurrentMovie,
	selectMoviesLoading,
	selectMoviesError,
	fetchMovieById,
	clearCurrentMovie,
} from '@/store/features/movies'
import { RatingDisplay, MediaPoster, WatchStateBadge, StarRating } from '@/components/elements'
import { WatchState } from '@/models/api/Enums'
import { updateMovieState, rateMovie } from '@/services/MediaService/MediaService'
import './MovieDetail.scss'

const MovieDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>()
	const { t, i18n } = useTranslation()
	const dispatch = useAppDispatch()
	const movie = useAppSelector(selectCurrentMovie)
	const loading = useAppSelector(selectMoviesLoading)
	const error = useAppSelector(selectMoviesError)
	const activeProfileId = useAppSelector(selectActiveProfileId)
	const [savingRating, setSavingRating] = useState(false)

	useEffect(() => {
		if (id) {
			dispatch(fetchMovieById({ id: Number(id), profileId: activeProfileId }))
		}
		return () => {
			dispatch(clearCurrentMovie())
		}
	}, [dispatch, id, activeProfileId])

	const handleStateToggle = async () => {
		if (!activeProfileId || !movie) return
		const newState = movie.state === WatchState.Seen ? WatchState.Unseen : WatchState.Seen
		await updateMovieState(activeProfileId, movie.id, { state: newState })
		if (id) dispatch(fetchMovieById({ id: Number(id), profileId: activeProfileId }))
	}

	const handleRate = async (rating: number | null) => {
		if (!activeProfileId || !movie) return
		setSavingRating(true)
		await rateMovie(movie.id, activeProfileId, rating)
		if (id) dispatch(fetchMovieById({ id: Number(id), profileId: activeProfileId }))
		setSavingRating(false)
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
	const title = (useSpanish ? movie.spanishTranslation?.title : null) ?? movie.title
	const overview = (useSpanish ? movie.spanishTranslation?.overview : null) ?? movie.overview

	return (
		<div className='movie-detail'>
			<div className='movie-detail__back'>
				<Link to='/movies'>← {t('common.back')}</Link>
			</div>

			<div className='movie-detail__hero'>
				<MediaPoster
					mediaItemId={movie.mediaItemId}
					alt={title}
					className='movie-detail__poster'
					fallback='🎬'
				/>
				<div className='movie-detail__info'>
					<div className='movie-detail__title-row'>
						<h1>{title}</h1>
						<WatchStateBadge state={movie.state} />
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
					</div>
					{movie.ratings.length > 0 && <RatingDisplay ratings={movie.ratings} />}
					<StarRating
						value={movie.userRating ?? null}
						onChange={handleRate}
						saving={savingRating}
					/>

					<button
						className={`movie-detail__toggle ${movie.state === WatchState.Seen ? 'movie-detail__toggle--seen' : ''}`}
						onClick={handleStateToggle}>
						{movie.state === WatchState.Seen
							? t('watchState.markUnseen')
							: t('watchState.markSeen')}
					</button>

					{overview && <p className='movie-detail__overview'>{overview}</p>}
				</div>
			</div>
		</div>
	)
}

export default MovieDetail
