import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { PersonCreditsDto, PersonCreditItemDto } from '@/models/api'
import { getPersonCredits, getMovieById, addManually } from '@/services/MediaService/MediaService'
import { MediaPoster } from '@/components/elements'
import { useAppSelector } from '@/store/hooks'
import { selectCurrentProfile } from '@/store/features/profile'
import './Person.scss'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185'

const Person: React.FC = () => {
	const { tmdbPersonId } = useParams<{ tmdbPersonId: string }>()
	const { t } = useTranslation()
	const navigate = useNavigate()
	const profile = useAppSelector(selectCurrentProfile)
	const [data, setData] = useState<PersonCreditsDto | null>(null)
	const [loading, setLoading] = useState(true)
	const [pendingCredit, setPendingCredit] = useState<PersonCreditItemDto | null>(null)
	const [isAdding, setIsAdding] = useState(false)

	useEffect(() => {
		if (!tmdbPersonId) return
		let cancelled = false
		setLoading(true)
		getPersonCredits(Number(tmdbPersonId), profile?.id)
			.then((d) => {
				if (!cancelled) setData(d)
			})
			.catch(() => {
				/* silently ignore */
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [tmdbPersonId, profile?.id])

	useEffect(() => {
		if (data?.name) {
			document.title = `${data.name} — Jellywatch`
		}
		return () => {
			document.title = 'Jellywatch'
		}
	}, [data])

	const handleMovieClick = async (credit: PersonCreditItemDto) => {
		if (credit.localMediaItemId == null) return
		try {
			await getMovieById(credit.localMediaItemId, profile?.id)
			navigate(`/movies/${credit.localMediaItemId}`)
		} catch {
			setPendingCredit(credit)
		}
	}

	const handleConfirmAdd = async () => {
		if (!pendingCredit || !profile) return
		setIsAdding(true)
		try {
			const type = pendingCredit.mediaType === 'tv' ? 'series' : 'movie'
			const result = await addManually({
				tmdbId: pendingCredit.tmdbId,
				type,
				profileId: profile.id,
			})
			if (type === 'series' && result.seriesId) {
				navigate(`/series/${result.seriesId}`)
			} else {
				navigate(`/movies/${result.movieId ?? result.mediaItemId}`)
			}
		} finally {
			setIsAdding(false)
			setPendingCredit(null)
		}
	}

	if (loading) {
		return (
			<div className='person'>
				<p className='person__loading'>{t('common.loading')}</p>
			</div>
		)
	}

	if (!data) {
		return (
			<div className='person'>
				<p>{t('common.error')}</p>
			</div>
		)
	}

	const myCredits = data.credits
		.filter((c) => c.localMediaItemId != null && c.isInYourLibrary)
		.sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))
	const appCredits = data.credits
		.filter((c) => c.localMediaItemId != null && !c.isInYourLibrary)
		.sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))
	const otherCredits = data.credits
		.filter((c) => c.localMediaItemId == null)
		.sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))

	return (
		<>
			<div className='person'>
				<button className='person__back' onClick={() => navigate(-1)}>
					← {t('common.back')}
				</button>

				<div className='person__header'>
					{data.profilePath ? (
						<img
							className='person__photo'
							src={`${TMDB_IMAGE_BASE}${data.profilePath}`}
							alt={data.name}
						/>
					) : (
						<div className='person__photo person__photo--fallback'>
							<span>👤</span>
						</div>
					)}
					<h1 className='person__name'>{data.name}</h1>
				</div>

				{myCredits.length > 0 && (
					<div className='person__section'>
						<h2>{t('cast.inYourLibrary')}</h2>
						<div className='person__grid'>
							{myCredits.map((credit, i) => {
								const linkTo =
									credit.mediaType === 'tv'
										? `/series/${credit.localMediaItemId}`
										: `/movies/${credit.localMediaItemId}`
								const isMovie = credit.mediaType !== 'tv'
								if (isMovie) {
									return (
										<button
											key={`${credit.tmdbId}-${i}`}
											className='person__credit person__credit--btn'
											onClick={() => handleMovieClick(credit)}>
											<MediaPoster
												mediaItemId={credit.localAssetId}
												alt={credit.title}
												className='person__credit-poster'
											/>
											<div className='person__credit-info'>
												<span className='person__credit-title'>{credit.title}</span>
												{credit.character && (
													<span className='person__credit-character'>{credit.character}</span>
												)}
												{credit.releaseDate && (
													<span className='person__credit-year'>
														{credit.releaseDate.slice(0, 4)}
													</span>
												)}
												{credit.voteAverage != null && credit.voteAverage > 0 && (
													<span className='person__credit-rating'>
														★ {credit.voteAverage.toFixed(1)}
													</span>
												)}
											</div>
										</button>
									)
								}
								return (
									<Link key={`${credit.tmdbId}-${i}`} to={linkTo} className='person__credit'>
										<MediaPoster
											mediaItemId={credit.localAssetId}
											alt={credit.title}
											className='person__credit-poster'
										/>
										<div className='person__credit-info'>
											<span className='person__credit-title'>{credit.title}</span>
											{credit.character && (
												<span className='person__credit-character'>{credit.character}</span>
											)}
											{credit.releaseDate && (
												<span className='person__credit-year'>
													{credit.releaseDate.slice(0, 4)}
												</span>
											)}
											{credit.voteAverage != null && credit.voteAverage > 0 && (
												<span className='person__credit-rating'>
													★ {credit.voteAverage.toFixed(1)}
												</span>
											)}
										</div>
									</Link>
								)
							})}
						</div>
					</div>
				)}

				{appCredits.length > 0 && (
					<div className='person__section'>
						<h2>{t('cast.inYourMedia')}</h2>
						<div className='person__grid'>
							{appCredits.map((credit, i) => {
								const linkTo =
									credit.mediaType === 'tv'
										? `/series/${credit.localMediaItemId}`
										: `/movies/${credit.localMediaItemId}`
								const isMovie = credit.mediaType !== 'tv'
								return (
									<div
										key={`${credit.tmdbId}-${i}`}
										className='person__credit person__credit--other'>
										{isMovie ? (
											<button
												className='person__credit-poster-btn'
												onClick={() => handleMovieClick(credit)}>
												<MediaPoster
													mediaItemId={credit.localAssetId}
													alt={credit.title}
													className='person__credit-poster'
												/>
											</button>
										) : (
											<Link to={linkTo} className='person__credit-poster-link'>
												<MediaPoster
													mediaItemId={credit.localAssetId}
													alt={credit.title}
													className='person__credit-poster'
												/>
											</Link>
										)}
										<div className='person__credit-info'>
											<span className='person__credit-title'>{credit.title}</span>
											{credit.character && (
												<span className='person__credit-character'>{credit.character}</span>
											)}
											{credit.releaseDate && (
												<span className='person__credit-year'>
													{credit.releaseDate.slice(0, 4)}
												</span>
											)}
											{credit.voteAverage != null && credit.voteAverage > 0 && (
												<span className='person__credit-rating'>
													★ {credit.voteAverage.toFixed(1)}
												</span>
											)}
											{profile && (
												<button
													className='person__credit-add'
													onClick={() => setPendingCredit(credit)}
													title={t('common.add')}>
													+
												</button>
											)}
										</div>
									</div>
								)
							})}
						</div>
					</div>
				)}

				{otherCredits.length > 0 && (
					<div className='person__section'>
						<h2>{t('cast.otherCredits')}</h2>
						<div className='person__grid'>
							{otherCredits.map((credit, i) => (
								<div key={`${credit.tmdbId}-${i}`} className='person__credit person__credit--other'>
									{credit.posterPath ? (
										<img
											className='person__credit-poster-img'
											src={`${TMDB_IMAGE_BASE}${credit.posterPath}`}
											alt={credit.title}
											loading='lazy'
										/>
									) : (
										<div className='person__credit-poster-img person__credit-poster-img--fallback'>
											<span>🎬</span>
										</div>
									)}
									<div className='person__credit-info'>
										<span className='person__credit-title'>{credit.title}</span>
										{credit.character && (
											<span className='person__credit-character'>{credit.character}</span>
										)}
										{credit.releaseDate && (
											<span className='person__credit-year'>{credit.releaseDate.slice(0, 4)}</span>
										)}
										{credit.voteAverage != null && credit.voteAverage > 0 && (
											<span className='person__credit-rating'>
												★ {credit.voteAverage.toFixed(1)}
											</span>
										)}
										{profile && (
											<button
												className='person__credit-add'
												onClick={() => setPendingCredit(credit)}
												title={t('common.add')}>
												+
											</button>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{pendingCredit && (
				<div className='person__add-overlay'>
					<div className='person__add-modal'>
						<p>
							<strong>{pendingCredit.title}</strong> no está en tu media. ¿Quieres añadirla?
						</p>
						<div className='person__add-modal-actions'>
							<button
								className='person__add-modal-confirm'
								onClick={handleConfirmAdd}
								disabled={isAdding}>
								{isAdding ? t('common.loading') : t('common.add')}
							</button>
							<button
								className='person__add-modal-cancel'
								onClick={() => setPendingCredit(null)}
								disabled={isAdding}>
								{t('common.cancel')}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default Person
