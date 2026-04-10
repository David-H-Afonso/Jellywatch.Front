import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createTestStore } from '@/test/utils/createTestStore'
import MoviesList from '@/components/Movies/MoviesList/MoviesList'
import { createMovieListDto, createPagedResult } from '@/test/factories'

vi.mock('@/services/AdminService/AdminService', () => ({
	triggerMineSync: vi.fn().mockResolvedValue(undefined),
}))

const API = 'http://localhost:5011'

const mockMovies = [
	createMovieListDto({ id: 1, title: 'Inception', state: 2 }),
	createMovieListDto({ id: 2, title: 'The Matrix', state: 1 }),
	createMovieListDto({ id: 3, title: 'Pulp Fiction', state: 0 }),
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

function renderMoviesList() {
	const store = createTestStore(authState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/movies']}>
						<Routes>
							<Route path='/movies' element={<MoviesList />} />
							<Route path='/movies/:id' element={<div>Movie Detail</div>} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Movies List Flow', () => {
	beforeEach(() => {
		server.use(
			http.get(`${API}/api/media/movies`, ({ request }) => {
				const url = new URL(request.url)
				const search = url.searchParams.get('search')
				let filtered = [...mockMovies]
				if (search) {
					filtered = filtered.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
				}
				return HttpResponse.json(
					createPagedResult(filtered, { page: 1, totalPages: 1, totalCount: filtered.length })
				)
			})
		)
	})

	it('loads and displays movie list', async () => {
		renderMoviesList()
		await waitFor(() => {
			expect(screen.getByText('Inception')).toBeInTheDocument()
		})
		expect(screen.getByText('The Matrix')).toBeInTheDocument()
		expect(screen.getByText('Pulp Fiction')).toBeInTheDocument()
	})

	it('updates store with fetched movies', async () => {
		const { store } = renderMoviesList()
		await waitFor(() => {
			const state = store.getState()
			expect(state.movies.movies.length).toBe(3)
		})
	})

	it('shows movies page heading', async () => {
		renderMoviesList()
		await waitFor(() => {
			expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
		})
	})

	it('movie cards are links to detail pages', async () => {
		renderMoviesList()
		await waitFor(() => {
			expect(screen.getByText('Inception')).toBeInTheDocument()
		})
		const links = screen.getAllByRole('link')
		const movieLinks = links.filter((l) => l.getAttribute('href')?.startsWith('/movies/'))
		expect(movieLinks.length).toBeGreaterThanOrEqual(3)
	})

	it('shows empty state when no movies', async () => {
		server.use(
			http.get(`${API}/api/media/movies`, () => {
				return HttpResponse.json(createPagedResult([], { page: 1, totalPages: 0, totalCount: 0 }))
			})
		)
		renderMoviesList()
		await waitFor(() => {
			expect(screen.getByText(/no movies found/i)).toBeInTheDocument()
		})
	})

	it('shows error on API failure', async () => {
		server.use(
			http.get(`${API}/api/media/movies`, () => {
				return HttpResponse.json({ message: 'Error' }, { status: 500 })
			})
		)
		const { store } = renderMoviesList()
		await waitFor(() => {
			expect(store.getState().movies.error).toBeTruthy()
		})
	})

	it('has import button', async () => {
		renderMoviesList()
		await waitFor(() => {
			expect(screen.getByText('Inception')).toBeInTheDocument()
		})
		expect(screen.getByText(/import/i)).toBeInTheDocument()
	})
})
