import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { PersonCreditsDto } from '@/models/api'
import { getPersonCredits } from '@/services/MediaService/MediaService'
import { MediaPoster } from '@/components/elements'
import './Person.scss'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185'

const Person: React.FC = () => {
	const { tmdbPersonId } = useParams<{ tmdbPersonId: string }>()
	const { t } = useTranslation()
	const navigate = useNavigate()
	const [data, setData] = useState<PersonCreditsDto | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!tmdbPersonId) return
		let cancelled = false
		setLoading(true)
		getPersonCredits(Number(tmdbPersonId))
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
	}, [tmdbPersonId])

	useEffect(() => {
		if (data?.name) {
			document.title = `${data.name} — Jellywatch`
		}
		return () => {
			document.title = 'Jellywatch'
		}
	}, [data])

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

	const localCredits = data.credits
		.filter((c) => c.localMediaItemId != null)
		.sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))
	const otherCredits = data.credits
		.filter((c) => c.localMediaItemId == null)
		.sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))

	return (
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

			{localCredits.length > 0 && (
				<div className='person__section'>
					<h2>{t('cast.inYourLibrary')}</h2>
					<div className='person__grid'>
						{localCredits.map((credit, i) => {
							const linkTo =
								credit.mediaType === 'tv'
									? `/series/${credit.localMediaItemId}`
									: `/movies/${credit.localMediaItemId}`
							return (
								<Link key={`${credit.tmdbId}-${i}`} to={linkTo} className='person__credit'>
									<MediaPoster
										mediaItemId={credit.localMediaItemId}
										alt={credit.title}
										className='person__credit-poster'
									/>
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
									</div>
								</Link>
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
										<span className='person__credit-rating'>★ {credit.voteAverage.toFixed(1)}</span>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

export default Person
