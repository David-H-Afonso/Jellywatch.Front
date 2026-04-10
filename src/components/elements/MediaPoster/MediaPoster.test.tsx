import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MediaPoster } from '@/components/elements/MediaPoster/MediaPoster'

describe('MediaPoster', () => {
	it('renders fallback emoji when mediaItemId is null', () => {
		const { container } = render(<MediaPoster mediaItemId={null} alt='Test' />)
		expect(container.querySelector('.media-poster--fallback')).toBeInTheDocument()
		expect(screen.getByText('🎬')).toBeInTheDocument()
	})

	it('renders custom fallback emoji', () => {
		render(<MediaPoster mediaItemId={null} alt='Test' fallback='📺' />)
		expect(screen.getByText('📺')).toBeInTheDocument()
	})

	it('renders img tag when mediaItemId is provided', () => {
		render(<MediaPoster mediaItemId={42} alt='Poster' />)
		const img = screen.getByRole('img', { name: 'Poster' })
		expect(img).toBeInTheDocument()
		expect(img.getAttribute('src')).toContain('/api/asset/42/Poster')
	})

	it('appends cacheBust param', () => {
		render(<MediaPoster mediaItemId={42} alt='P' cacheBust={12345} />)
		const img = screen.getByRole('img')
		expect(img.getAttribute('src')).toContain('?v=12345')
	})

	it('adds custom className', () => {
		const { container } = render(<MediaPoster mediaItemId={42} alt='P' className='custom' />)
		expect(container.querySelector('.media-poster.custom')).toBeInTheDocument()
	})
})
