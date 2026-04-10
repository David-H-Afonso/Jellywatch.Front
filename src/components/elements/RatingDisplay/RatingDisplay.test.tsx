import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { RatingDisplay } from '@/components/elements/RatingDisplay/RatingDisplay'
import { ExternalProvider } from '@/models/api/Enums'

describe('RatingDisplay', () => {
	it('renders nothing when ratings array is empty', () => {
		const { container } = render(<RatingDisplay ratings={[]} />)
		expect(container.innerHTML).toBe('')
	})

	it('renders rating chips for each provider', () => {
		const ratings = [
			{ provider: ExternalProvider.Tmdb, score: '7.5', voteCount: 1000 },
			{ provider: ExternalProvider.Imdb, score: '8.1', voteCount: 500 },
		]
		const { container } = render(<RatingDisplay ratings={ratings} />)

		expect(container.querySelector('.rating--tmdb')).toBeInTheDocument()
		expect(container.querySelector('.rating--imdb')).toBeInTheDocument()
		expect(container.querySelectorAll('.rating-chip')).toHaveLength(2)
	})

	it('shows dash when score is null', () => {
		const ratings = [{ provider: ExternalProvider.Tmdb, score: null, voteCount: null }]
		const { container } = render(<RatingDisplay ratings={ratings} />)
		const score = container.querySelector('.rating-score')
		expect(score?.textContent).toBe('—')
	})

	it('shows score text', () => {
		const ratings = [{ provider: ExternalProvider.Imdb, score: '8.5', voteCount: 200 }]
		const { container } = render(<RatingDisplay ratings={ratings} />)
		const score = container.querySelector('.rating-score')
		expect(score?.textContent).toBe('8.5')
	})

	it('shows correct provider labels', () => {
		const ratings = [{ provider: ExternalProvider.RottenTomatoes, score: '90%', voteCount: null }]
		const { container } = render(<RatingDisplay ratings={ratings} />)
		const label = container.querySelector('.rating-label')
		expect(label?.textContent).toBe('RT')
	})
})
