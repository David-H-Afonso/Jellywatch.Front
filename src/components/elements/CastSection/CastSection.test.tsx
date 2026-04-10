import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { CastSection } from '@/components/elements/CastSection/CastSection'
import type { CastMemberDto } from '@/models/api'

const mockCast: CastMemberDto[] = [
	{
		tmdbPersonId: 100,
		name: 'Actor One',
		character: 'Hero',
		profilePath: '/path/to/photo.jpg',
		totalEpisodeCount: 24,
	},
	{
		tmdbPersonId: 200,
		name: 'Actor Two',
		character: 'Villain',
		profilePath: null,
		totalEpisodeCount: 12,
	},
	{
		tmdbPersonId: 300,
		name: 'Actor Three',
		character: null,
		profilePath: '/path/to/other.jpg',
		totalEpisodeCount: 0,
	},
]

function renderCast(
	fetchCredits: () => Promise<CastMemberDto[]> = () => Promise.resolve(mockCast),
	mediaId = 1
) {
	return render(
		<I18nextProvider i18n={i18n}>
			<MemoryRouter>
				<CastSection fetchCredits={fetchCredits} mediaId={mediaId} />
			</MemoryRouter>
		</I18nextProvider>
	)
}

describe('CastSection', () => {
	it('renders nothing while loading', () => {
		const neverResolve = () => new Promise<CastMemberDto[]>(() => {})
		const { container } = renderCast(neverResolve)
		expect(container.innerHTML).toBe('')
	})

	it('renders nothing when cast is empty', async () => {
		const { container } = renderCast(() => Promise.resolve([]))
		await waitFor(() => {
			expect(container.innerHTML).toBe('')
		})
	})

	it('renders cast members after loading', async () => {
		renderCast()
		await waitFor(() => {
			expect(screen.getByText('Actor One')).toBeInTheDocument()
		})
		expect(screen.getByText('Actor Two')).toBeInTheDocument()
		expect(screen.getByText('Actor Three')).toBeInTheDocument()
	})

	it('shows character names', async () => {
		renderCast()
		await waitFor(() => {
			expect(screen.getByText('Hero')).toBeInTheDocument()
		})
		expect(screen.getByText('Villain')).toBeInTheDocument()
	})

	it('shows episode count when > 0', async () => {
		renderCast()
		await waitFor(() => {
			expect(screen.getByText(/24/)).toBeInTheDocument()
		})
		expect(screen.getByText(/12/)).toBeInTheDocument()
	})

	it('shows profile image for actors with profilePath', async () => {
		renderCast()
		await waitFor(() => {
			expect(screen.getByAltText('Actor One')).toBeInTheDocument()
		})
		const img = screen.getByAltText('Actor One') as HTMLImageElement
		expect(img.src).toContain('/path/to/photo.jpg')
	})

	it('shows fallback for actors without profilePath', async () => {
		renderCast()
		await waitFor(() => {
			expect(screen.getByText('Actor Two')).toBeInTheDocument()
		})
		expect(screen.getByText('👤')).toBeInTheDocument()
	})

	it('handles fetch error gracefully', async () => {
		const { container } = renderCast(() => Promise.reject(new Error('fail')))
		await waitFor(() => {
			// Should render nothing on error (cast stays empty)
			expect(container.innerHTML).toBe('')
		})
	})
})
