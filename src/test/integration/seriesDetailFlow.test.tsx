import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createTestStore } from '@/test/utils/createTestStore'
import SeriesDetail from '@/components/Series/SeriesDetail/SeriesDetail'
import {
	createSeriesDetailDto,
	createSeasonDto,
	createEpisodeDto,
	createExternalRatingDto,
} from '@/test/factories'

const API = 'http://localhost:5011'

const episodes = [
	createEpisodeDto({
		id: 101,
		episodeNumber: 1,
		name: 'Pilot',
		state: 2,
		watchedAt: '2024-01-15T10:00:00Z',
	}),
	createEpisodeDto({ id: 102, episodeNumber: 2, name: "Cat's in the Bag", state: 2 }),
	createEpisodeDto({ id: 103, episodeNumber: 3, name: "And the Bag's in the River", state: 0 }),
]

const seasons = [
	createSeasonDto({
		id: 10,
		seasonNumber: 1,
		name: 'Season 1',
		episodes,
		episodesSeen: 2,
		episodeCount: 3,
	}),
]

const mockSeries = createSeriesDetailDto({
	id: 1,
	title: 'Breaking Bad',
	originalTitle: 'Breaking Bad',
	overview: 'A high school chemistry teacher turned meth kingpin.',
	releaseDate: '2008-01-20',
	status: 'Ended',
	network: 'AMC',
	genres: 'Drama,Crime,Thriller',
	totalSeasons: 5,
	seasons,
	ratings: [createExternalRatingDto({ provider: 0, score: '9.5' })],
	userRating: 8,
	mediaItemId: 1001,
	isInLibrary: true,
})

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

function renderSeriesDetail() {
	const store = createTestStore(authState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/series/1']}>
						<Routes>
							<Route path='/series/:id' element={<SeriesDetail />} />
							<Route path='/series' element={<div>Series List</div>} />
							<Route path='/person/:id' element={<div>Person Page</div>} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Series Detail Flow', () => {
	beforeEach(() => {
		server.use(
			http.get(`${API}/api/media/series/:id`, () => {
				return HttpResponse.json(mockSeries)
			}),
			http.get(`${API}/api/media/series/:id/credits`, () => {
				return HttpResponse.json([])
			}),
			http.patch(`${API}/api/profile/:profileId/episodes/:episodeId/state`, () => {
				return new HttpResponse(null, { status: 204 })
			}),
			http.patch(`${API}/api/media/series/:id/rating`, () => {
				return new HttpResponse(null, { status: 204 })
			})
		)
	})

	it('loads and displays series title', async () => {
		renderSeriesDetail()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
	})

	it('shows series overview', async () => {
		renderSeriesDetail()
		await waitFor(() => {
			expect(screen.getByText(/meth kingpin/)).toBeInTheDocument()
		})
	})

	it('displays metadata (year, status, network)', async () => {
		renderSeriesDetail()
		await waitFor(() => {
			expect(screen.getByText('2008')).toBeInTheDocument()
		})
		expect(screen.getByText('Ended')).toBeInTheDocument()
		expect(screen.getByText('AMC')).toBeInTheDocument()
	})

	it('shows genres as tags', async () => {
		renderSeriesDetail()
		await waitFor(() => {
			expect(screen.getByText('Drama')).toBeInTheDocument()
		})
		expect(screen.getByText('Crime')).toBeInTheDocument()
		expect(screen.getByText('Thriller')).toBeInTheDocument()
	})

	it('displays season list with episode count', async () => {
		renderSeriesDetail()
		await waitFor(() => {
			expect(screen.getByText(/Season 1/)).toBeInTheDocument()
		})
		expect(screen.getByText(/2\/3/)).toBeInTheDocument()
	})

	it('expands season to show episodes', async () => {
		const user = userEvent.setup()
		renderSeriesDetail()

		await waitFor(() => {
			expect(screen.getByText(/Season 1/)).toBeInTheDocument()
		})

		// Click on season header (has role="button")
		const seasonBtn = screen.getByText(/Season 1/).closest('[role="button"]')!
		await user.click(seasonBtn)

		await waitFor(() => {
			expect(screen.getByText('Pilot')).toBeInTheDocument()
		})
		expect(screen.getByText(/Cat.s in the Bag/)).toBeInTheDocument()
	})

	it('shows back link to series list', async () => {
		renderSeriesDetail()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		const backLink = screen.getByText(/back/i)
		expect(backLink).toBeInTheDocument()
		expect(backLink.closest('a')?.getAttribute('href')).toBe('/series')
	})

	it('stores fetched series in Redux', async () => {
		const { store } = renderSeriesDetail()
		await waitFor(() => {
			const state = store.getState()
			expect(state.series.currentSeries?.title).toBe('Breaking Bad')
		})
	})

	it('shows star rating component', async () => {
		renderSeriesDetail()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		// Star rating buttons should be present
		const starButtons = screen.getAllByRole('button').filter((b) => b.className.includes('star'))
		expect(starButtons.length).toBeGreaterThanOrEqual(1)
	})

	it('shows loading state initially', () => {
		server.use(
			http.get(`${API}/api/media/series/:id`, () => {
				return new Promise(() => {}) // Never resolves
			})
		)
		renderSeriesDetail()
		expect(screen.getByText(/loading/i)).toBeInTheDocument()
	})

	it('shows error state on failure', async () => {
		server.use(
			http.get(`${API}/api/media/series/:id`, () => {
				return HttpResponse.json({ message: 'Not found' }, { status: 404 })
			})
		)
		renderSeriesDetail()
		await waitFor(() => {
			expect(screen.getByText(/error|back/i)).toBeInTheDocument()
		})
	})
})
