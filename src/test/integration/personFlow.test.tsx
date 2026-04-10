import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { createTestStore } from '@/test/utils/createTestStore'
import Person from '@/components/Person/Person'
import type { PersonCreditsDto } from '@/models/api'

const mockCredits: PersonCreditsDto = {
	tmdbPersonId: 123,
	name: 'Bryan Cranston',
	profilePath: '/cranston.jpg',
	credits: [
		{
			tmdbId: 1396,
			title: 'Breaking Bad',
			character: 'Walter White',
			mediaType: 'tv',
			releaseDate: '2008-01-20',
			posterPath: '/bb.jpg',
			voteAverage: 9.5,
			localMediaItemId: 100,
			localAssetId: 100,
			isInYourLibrary: true,
		},
		{
			tmdbId: 49026,
			title: 'The Dark Knight Rises',
			character: 'Jim Gordon',
			mediaType: 'movie',
			releaseDate: '2012-07-20',
			posterPath: '/dk.jpg',
			voteAverage: 8.4,
			localMediaItemId: 200,
			localAssetId: 200,
			isInYourLibrary: false,
		},
		{
			tmdbId: 9999,
			title: 'Unknown Film',
			character: 'Cameo',
			mediaType: 'movie',
			releaseDate: '2020-01-01',
			posterPath: null,
			voteAverage: 5.0,
			localMediaItemId: null,
			localAssetId: null,
			isInYourLibrary: false,
		},
	],
}

vi.mock('@/services/MediaService/MediaService', () => ({
	getPersonCredits: vi.fn().mockImplementation(() => Promise.resolve(mockCredits)),
	getMovieById: vi.fn().mockRejectedValue(new Error('not found')),
	addManually: vi.fn().mockResolvedValue({ movieId: 999, mediaItemId: 999 }),
}))

vi.mock('@/services/AdminService/AdminService', () => ({
	triggerMineSync: vi.fn().mockResolvedValue(undefined),
}))

const authState = {
	auth: {
		isAuthenticated: true,
		token: 'tok',
		user: {
			id: 1,
			username: 'u',
			isAdmin: false,
			avatarUrl: null,
			preferredLanguage: 'en',
			jellyfinUserId: 'j',
			profiles: [{ id: 10, displayName: 'Main', jellyfinUserId: 'jf-user-1', isJoint: false }],
			activeProfileId: 10,
		},
		loading: false,
		error: null,
	},
}

function renderPerson(tmdbId = '123') {
	const store = createTestStore(authState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={[`/person/${tmdbId}`]}>
						<Routes>
							<Route path='/person/:tmdbPersonId' element={<Person />} />
							<Route path='/series/:id' element={<div>Series Detail</div>} />
							<Route path='/movies/:id' element={<div>Movie Detail</div>} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Person Flow', () => {
	it('displays person name', async () => {
		renderPerson()
		await waitFor(() => {
			expect(screen.getByText('Bryan Cranston')).toBeInTheDocument()
		})
	})

	it('shows person photo', async () => {
		renderPerson()
		await waitFor(() => {
			const img = screen.getByAltText('Bryan Cranston')
			expect(img).toBeInTheDocument()
			expect(img).toHaveAttribute('src', expect.stringContaining('/cranston.jpg'))
		})
	})

	it('shows "in your library" credits section', async () => {
		renderPerson()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		expect(screen.getByText('Walter White')).toBeInTheDocument()
	})

	it('shows character names', async () => {
		renderPerson()
		await waitFor(() => {
			expect(screen.getByText('Walter White')).toBeInTheDocument()
			expect(screen.getByText('Jim Gordon')).toBeInTheDocument()
			expect(screen.getByText('Cameo')).toBeInTheDocument()
		})
	})

	it('shows release years for credits', async () => {
		renderPerson()
		await waitFor(() => {
			expect(screen.getByText('2008')).toBeInTheDocument()
			expect(screen.getByText('2012')).toBeInTheDocument()
		})
	})

	it('shows ratings for credits', async () => {
		renderPerson()
		await waitFor(() => {
			expect(screen.getByText(/9\.5/)).toBeInTheDocument()
			expect(screen.getByText(/8\.4/)).toBeInTheDocument()
		})
	})

	it('has back button', async () => {
		renderPerson()
		await waitFor(() => {
			expect(screen.getByText('Bryan Cranston')).toBeInTheDocument()
		})
		const backButton = screen.getByRole('button', { name: /back/i })
		expect(backButton).toBeInTheDocument()
	})

	it('separates library credits from other credits', async () => {
		renderPerson()
		await waitFor(() => {
			// Should have section headings
			const sections = document.querySelectorAll('.person__section')
			expect(sections.length).toBeGreaterThanOrEqual(2)
		})
	})

	it('displays fallback for credits without poster', async () => {
		renderPerson()
		await waitFor(() => {
			expect(screen.getByText('Unknown Film')).toBeInTheDocument()
		})
		// Should have fallback emoji
		expect(screen.getByText('🎬')).toBeInTheDocument()
	})
})
