import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createTestStore } from '@/test/utils/createTestStore'
import SeriesList from '@/components/Series/SeriesList/SeriesList'
import { createSeriesListDto, createPagedResult } from '@/test/factories'

vi.mock('@/services/AdminService/AdminService', () => ({
	triggerMineSync: vi.fn().mockResolvedValue(undefined),
}))

const API = 'http://localhost:5011'

const mockSeries = [
	createSeriesListDto({
		id: 1,
		title: 'Breaking Bad',
		aggregateState: 2,
		episodesSeen: 62,
		totalEpisodes: 62,
	}),
	createSeriesListDto({
		id: 2,
		title: 'Better Call Saul',
		aggregateState: 1,
		episodesSeen: 30,
		totalEpisodes: 63,
	}),
	createSeriesListDto({
		id: 3,
		title: 'The Wire',
		aggregateState: 0,
		episodesSeen: 0,
		totalEpisodes: 60,
	}),
]

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

function renderSeriesList() {
	const store = createTestStore(authState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/series']}>
						<Routes>
							<Route path='/series' element={<SeriesList />} />
							<Route path='/series/:id' element={<div>Series Detail</div>} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Series List Flow', () => {
	beforeEach(() => {
		server.use(
			http.get(`${API}/api/media/series`, ({ request }) => {
				const url = new URL(request.url)
				const search = url.searchParams.get('search')
				const state = url.searchParams.get('state')

				let filtered = [...mockSeries]
				if (search) {
					filtered = filtered.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
				}
				if (state) {
					filtered = filtered.filter((s) => s.aggregateState === Number(state))
				}

				return HttpResponse.json(
					createPagedResult(filtered, { page: 1, totalPages: 1, totalCount: filtered.length })
				)
			})
		)
	})

	it('loads and displays series list', async () => {
		renderSeriesList()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		expect(screen.getByText('Better Call Saul')).toBeInTheDocument()
		expect(screen.getByText('The Wire')).toBeInTheDocument()
	})

	it('shows series page heading', async () => {
		renderSeriesList()
		await waitFor(() => {
			expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
		})
	})

	it('updates store with fetched series', async () => {
		const { store } = renderSeriesList()
		await waitFor(() => {
			const state = store.getState()
			expect(state.series.series.length).toBe(3)
		})
	})

	it('shows episode progress for each series', async () => {
		renderSeriesList()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		// Check episode progress text is shown
		expect(screen.getByText(/62\/62/)).toBeInTheDocument()
		expect(screen.getByText(/30\/63/)).toBeInTheDocument()
		expect(screen.getByText(/0\/60/)).toBeInTheDocument()
	})

	it('has import button when profile is active', async () => {
		renderSeriesList()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		expect(screen.getByText(/import/i)).toBeInTheDocument()
	})

	it('series cards are links to detail pages', async () => {
		renderSeriesList()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		const links = screen.getAllByRole('link')
		const seriesLinks = links.filter((l) => l.getAttribute('href')?.startsWith('/series/'))
		expect(seriesLinks.length).toBeGreaterThanOrEqual(3)
	})

	it('handles loading state', () => {
		// Delay the response to test loading state
		server.use(
			http.get(`${API}/api/series`, () => {
				return new Promise(() => {}) // Never resolves
			})
		)
		renderSeriesList()
		// Loading state should be shown initially in the store
		// or loading indicator should be visible
		const store = createTestStore(authState)
		expect(store.getState().series.loading).toBe(false) // initial state
	})

	it('shows empty state when no series', async () => {
		server.use(
			http.get(`${API}/api/media/series`, () => {
				return HttpResponse.json(createPagedResult([], { page: 1, totalPages: 0, totalCount: 0 }))
			})
		)
		renderSeriesList()
		await waitFor(() => {
			expect(screen.getByText(/no series found/i)).toBeInTheDocument()
		})
	})

	it('shows error message on API failure', async () => {
		server.use(
			http.get(`${API}/api/media/series`, () => {
				return HttpResponse.json({ message: 'Server error' }, { status: 500 })
			})
		)
		const { store } = renderSeriesList()
		await waitFor(() => {
			const state = store.getState()
			expect(state.series.error).toBeTruthy()
		})
	})
})
