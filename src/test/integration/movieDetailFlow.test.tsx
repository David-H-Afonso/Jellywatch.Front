import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createTestStore } from '@/test/utils/createTestStore'
import MovieDetail from '@/components/Movies/MovieDetail/MovieDetail'
import { createMovieDetailDto, createExternalRatingDto } from '@/test/factories'
import { WatchState, ExternalProvider } from '@/models/api/Enums'

vi.mock('@/services/MediaService/MediaService', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/services/MediaService/MediaService')>()),
	updateMovieState: vi.fn().mockResolvedValue(undefined),
	rateMovie: vi.fn().mockResolvedValue(undefined),
	uploadCustomPoster: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/AdminService/AdminService', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/services/AdminService/AdminService')>()),
	deleteMediaItem: vi.fn().mockResolvedValue(undefined),
	refreshMediaItem: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/services/ProfileService/ProfileService', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/services/ProfileService/ProfileService')>()),
	removeMediaFromProfile: vi.fn().mockResolvedValue(undefined),
	blockMediaForProfile: vi.fn().mockResolvedValue(undefined),
	unblockMediaForProfile: vi.fn().mockResolvedValue(undefined),
}))

const API = 'http://localhost:5011'

const mockMovie = createMovieDetailDto({
	id: 42,
	mediaItemId: 100,
	title: 'Inception',
	originalTitle: 'Inception',
	overview: 'A mind-bending thriller about dreams within dreams.',
	releaseDate: '2010-07-16',
	genres: 'Sci-Fi,Thriller,Action',
	runtime: 148,
	state: WatchState.Unseen,
	userRating: null,
	watchedAt: null,
	isBlocked: false,
	ratings: [
		createExternalRatingDto({
			provider: ExternalProvider.Tmdb,
			score: '8.4',
		}),
	],
})

const authState = {
	auth: {
		isAuthenticated: true,
		token: 'tok',
		user: {
			id: 1,
			username: 'u',
			isAdmin: true,
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

function renderMovieDetail(movieId = '42') {
	server.use(
		http.get(`${API}/api/media/movies/${movieId}`, () => {
			return HttpResponse.json(mockMovie)
		}),
		http.get(`${API}/api/media/movies/${movieId}/credits`, () => {
			return HttpResponse.json([])
		})
	)
	const store = createTestStore(authState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={[`/movies/${movieId}`]}>
						<Routes>
							<Route path='/movies/:id' element={<MovieDetail />} />
							<Route path='/movies' element={<div>Movies List</div>} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Movie Detail Flow', () => {
	it('displays movie title', async () => {
		renderMovieDetail()
		await waitFor(() => {
			expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Inception')
		})
	})

	it('shows movie overview', async () => {
		renderMovieDetail()
		await waitFor(() => {
			expect(screen.getByText(/mind-bending thriller/)).toBeInTheDocument()
		})
	})

	it('displays release year', async () => {
		renderMovieDetail()
		await waitFor(() => {
			expect(screen.getByText('2010')).toBeInTheDocument()
		})
	})

	it('shows runtime', async () => {
		renderMovieDetail()
		await waitFor(() => {
			expect(screen.getByText(/148/)).toBeInTheDocument()
		})
	})

	it('displays genre tags', async () => {
		renderMovieDetail()
		await waitFor(() => {
			expect(screen.getByText('Sci-Fi')).toBeInTheDocument()
			expect(screen.getByText('Thriller')).toBeInTheDocument()
			expect(screen.getByText('Action')).toBeInTheDocument()
		})
	})

	it('shows external ratings', async () => {
		renderMovieDetail()
		await waitFor(() => {
			expect(screen.getByText(/8\.4/)).toBeInTheDocument()
		})
	})

	it('shows watch state badge for unseen movie', async () => {
		renderMovieDetail()
		await waitFor(() => {
			const badge = document.querySelector('.watch-state-badge')
			expect(badge).toBeInTheDocument()
		})
	})

	it('shows toggle button to mark as seen', async () => {
		renderMovieDetail()
		await waitFor(() => {
			expect(screen.getByText(/mark.*seen/i)).toBeInTheDocument()
		})
	})

	it('has star rating component', async () => {
		renderMovieDetail()
		await waitFor(() => {
			const starRating = document.querySelector('.star-rating')
			expect(starRating).toBeInTheDocument()
		})
	})

	it('has back link to movies list', async () => {
		renderMovieDetail()
		await waitFor(() => {
			const backLink = screen.getByText(/back/i)
			expect(backLink).toBeInTheDocument()
			expect(backLink.closest('a')).toHaveAttribute('href', '/movies')
		})
	})

	it('stores movie in Redux', async () => {
		const { store } = renderMovieDetail()
		await waitFor(() => {
			const state = store.getState()
			expect(state.movies.currentMovie).not.toBeNull()
			expect(state.movies.currentMovie?.title).toBe('Inception')
		})
	})

	it('shows loading state initially', () => {
		const store = createTestStore({
			...authState,
			movies: {
				movies: [],
				currentMovie: null,
				loading: true,
				error: null,
				pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
				filters: {},
				lastAppliedFilters: null,
				isDataFresh: false,
			},
		})
		render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/movies/42']}>
						<Routes>
							<Route path='/movies/:id' element={<MovieDetail />} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		)
		expect(screen.getByText(/loading/i)).toBeInTheDocument()
	})

	it('shows error state when movie fails to load', async () => {
		server.use(
			http.get(`${API}/api/media/movies/:id`, () => {
				return HttpResponse.json({ error: 'Not Found' }, { status: 404 })
			})
		)
		const store = createTestStore(authState)
		render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/movies/999']}>
						<Routes>
							<Route path='/movies/:id' element={<MovieDetail />} />
							<Route path='/movies' element={<div>Movies List</div>} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		)
		await waitFor(() => {
			const errorState = document.querySelector('.error-state')
			expect(errorState).toBeInTheDocument()
		})
	})
})
