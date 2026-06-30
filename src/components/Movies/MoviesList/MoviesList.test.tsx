import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createTestStore } from '@/test/utils/createTestStore'
import MoviesList from '@/components/Movies/MoviesList/MoviesList'
import { createMovieListDto, createMoviesState, createPagedResult } from '@/test/factories'

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

function SearchParamsProbe() {
	const [params] = useSearchParams()
	return <span data-testid='search-params'>{params.toString()}</span>
}

function renderMoviesList(moviesState?: ReturnType<typeof createMoviesState>) {
	const store = createTestStore(moviesState ? { ...authState, movies: moviesState } : authState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/movies']}>
						<Routes>
							<Route
								path='/movies'
								element={
									<>
										<MoviesList />
										<SearchParamsProbe />
									</>
								}
							/>
							<Route path='/movies/:id' element={<div>Movie Detail</div>} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('MoviesList', () => {
	beforeEach(() => {
		server.use(
			http.get(`${API}/api/media/movies`, ({ request }) => {
				const search = new URL(request.url).searchParams.get('search')
				const filtered = search
					? mockMovies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
					: [...mockMovies]
				return HttpResponse.json(
					createPagedResult(filtered, { page: 1, totalPages: 1, totalCount: filtered.length })
				)
			})
		)
	})

	describe('loading indicator', () => {
		it('shows the loader on first load when there is no data yet', async () => {
			server.use(http.get(`${API}/api/media/movies`, () => new Promise(() => {})))
			const { store } = renderMoviesList()
			await waitFor(() => expect(store.getState().movies.loading).toBe(true))
			expect(document.querySelector('.loading-state')).toBeInTheDocument()
		})

		it('keeps the grid and hides the loader when refreshing a populated list', async () => {
			server.use(http.get(`${API}/api/media/movies`, () => new Promise(() => {})))
			const { store } = renderMoviesList(
				createMoviesState({
					movies: mockMovies,
					isDataFresh: true,
					pagination: { page: 1, pageSize: 20, totalCount: mockMovies.length, totalPages: 1 },
				})
			)
			await waitFor(() => expect(store.getState().movies.loading).toBe(true))
			expect(document.querySelector('.loading-state')).toBeNull()
			expect(screen.getByText('Inception')).toBeInTheDocument()
		})
	})

	describe('live search', () => {
		it('updates q in the URL with debounce while typing, without pressing Enter', async () => {
			renderMoviesList()
			await waitFor(() => expect(screen.getByText('Inception')).toBeInTheDocument())

			fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Matrix' } })
			expect(screen.getByTestId('search-params')).not.toHaveTextContent('q=Matrix')

			await waitFor(() =>
				expect(screen.getByTestId('search-params')).toHaveTextContent('q=Matrix')
			)
			await waitFor(() => expect(screen.queryByText('Inception')).not.toBeInTheDocument())
			expect(screen.getByText('The Matrix')).toBeInTheDocument()
		})

		it('coalesces rapid keystrokes into a single request', async () => {
			let searchRequests = 0
			server.use(
				http.get(`${API}/api/media/movies`, ({ request }) => {
					const search = new URL(request.url).searchParams.get('search')
					if (search) searchRequests++
					const filtered = search
						? mockMovies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
						: [...mockMovies]
					return HttpResponse.json(
						createPagedResult(filtered, { page: 1, totalPages: 1, totalCount: filtered.length })
					)
				})
			)
			renderMoviesList()
			await waitFor(() => expect(screen.getByText('Inception')).toBeInTheDocument())

			const input = screen.getByRole('textbox')
			fireEvent.change(input, { target: { value: 'M' } })
			fireEvent.change(input, { target: { value: 'Ma' } })
			fireEvent.change(input, { target: { value: 'Mat' } })
			fireEvent.change(input, { target: { value: 'Matr' } })

			await waitFor(() => expect(screen.queryByText('Inception')).not.toBeInTheDocument())
			expect(searchRequests).toBe(1)
		})

		it('commits the search when pressing Enter without reloading', async () => {
			renderMoviesList()
			await waitFor(() => expect(screen.getByText('Inception')).toBeInTheDocument())

			const input = screen.getByRole('textbox')
			fireEvent.change(input, { target: { value: 'Pulp' } })
			fireEvent.submit(input.closest('form') as HTMLFormElement)

			await waitFor(() => expect(screen.getByTestId('search-params')).toHaveTextContent('q=Pulp'))
			await waitFor(() => expect(screen.queryByText('Inception')).not.toBeInTheDocument())
			expect(screen.getByText('Pulp Fiction')).toBeInTheDocument()
		})
	})
})
