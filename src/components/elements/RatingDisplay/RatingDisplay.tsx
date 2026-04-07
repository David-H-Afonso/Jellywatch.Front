import React from 'react'
import type { ExternalRatingDto } from '@/models/api'
import { ExternalProvider } from '@/models/api/Enums'
import './RatingDisplay.scss'

interface Props {
	ratings: ExternalRatingDto[]
}

const providerLabels: Record<ExternalProvider, string> = {
	[ExternalProvider.Tmdb]: 'TMDB',
	[ExternalProvider.Imdb]: 'IMDb',
	[ExternalProvider.RottenTomatoes]: 'RT',
	[ExternalProvider.TvMaze]: 'TVmaze',
	[ExternalProvider.Omdb]: 'OMDb',
}

const providerClasses: Record<ExternalProvider, string> = {
	[ExternalProvider.Tmdb]: 'rating--tmdb',
	[ExternalProvider.Imdb]: 'rating--imdb',
	[ExternalProvider.RottenTomatoes]: 'rating--rt',
	[ExternalProvider.TvMaze]: 'rating--tvmaze',
	[ExternalProvider.Omdb]: 'rating--omdb',
}

export const RatingDisplay: React.FC<Props> = ({ ratings }) => {
	if (!ratings.length) return null

	return (
		<div className='rating-display'>
			{ratings.map((rating) => (
				<div key={rating.provider} className={`rating-chip ${providerClasses[rating.provider]}`}>
					<span className='rating-label'>{providerLabels[rating.provider]}</span>
					<span className='rating-score'>{rating.score ?? '—'}</span>
				</div>
			))}
		</div>
	)
}
