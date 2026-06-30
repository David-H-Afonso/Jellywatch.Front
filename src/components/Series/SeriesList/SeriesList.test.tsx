import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createTestStore } from '@/test/utils/createTestStore'
import SeriesList from '@/components/Series/SeriesList/SeriesList'
import { createSeriesListDto, createSeriesState, createPagedResult } from '@/test/factories'

vi.mock('@/services/AdminService/AdminService', () => ({
	triggerMineSync: vi.fn().mockResolvedValue(undefined),
}))

const API = 'http://localhost:5011'

const mockSeries = [
	createSeriesListDto({ id: 1, title: 'Breaking Bad', aggregateState: 2 }),
	createSeriesListDto({ id: 2, title: 'Better Call Saul', aggregateState: 1 }),
	createSeriesListDto({ id: 3, title: 'The Wire', aggregateState: 0 }),
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

function renderSeriesList(seriesState?: ReturnType<typeof createSeriesState>) {
	const store = createTestStore(seriesState ? { ...authState, series: seriesState } : authState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/series']}>
						<Routes>
							<Route
								path='/series'
								element={
									<>
										<SeriesList />
										<SearchParamsProbe />
									</>
								}
							/>
							<Route path='/series/:id' element={<div>Series Detail</div>} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('SeriesList', () => {
	beforeEach(() => {
		server.use(
			http.get(`${API}/api/media/series`, ({ request }) => {
				const search = new URL(request.url).searchParams.get('search')
				const filtered = search
					? mockSeries.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
					: [...mockSeries]
				return HttpResponse.json(
					createPagedResult(filtered, { page: 1, totalPages: 1, totalCount: filtered.length })
				)
			})
		)
	})

	describe('loading indicator', () => {
		it('shows the loader on first load when there is no data yet', async () => {
			server.use(http.get(`${API}/api/media/series`, () => new Promise(() => {})))
			const { store } = renderSeriesList()
			await waitFor(() => expect(store.getState().series.loading).toBe(true))
			expect(document.querySelector('.loading-state')).toBeInTheDocument()
		})

		it('keeps the grid and hides the loader when refreshing a populated list', async () => {
			server.use(http.get(`${API}/api/media/series`, () => new Promise(() => {})))
			const { store } = renderSeriesList(
				createSeriesState({
					series: mockSeries,
					isDataFresh: true,
					pagination: { page: 1, pageSize: 20, totalCount: mockSeries.length, totalPages: 1 },
				})
			)
			await waitFor(() => expect(store.getState().series.loading).toBe(true))
			expect(document.querySelector('.loading-state')).toBeNull()
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
	})

	describe('live search', () => {
		it('updates q in the URL with debounce while typing, without pressing Enter', async () => {
			renderSeriesList()
			await waitFor(() => expect(screen.getByText('Breaking Bad')).toBeInTheDocument())

			fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Better' } })
			expect(screen.getByTestId('search-params')).not.toHaveTextContent('q=Better')

			await waitFor(() =>
				expect(screen.getByTestId('search-params')).toHaveTextContent('q=Better')
			)
			await waitFor(() => expect(screen.queryByText('Breaking Bad')).not.toBeInTheDocument())
			expect(screen.getByText('Better Call Saul')).toBeInTheDocument()
		})

		it('coalesces rapid keystrokes into a single request', async () => {
			let searchRequests = 0
			server.use(
				http.get(`${API}/api/media/series`, ({ request }) => {
					const search = new URL(request.url).searchParams.get('search')
					if (search) searchRequests++
					const filtered = search
						? mockSeries.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
						: [...mockSeries]
					return HttpResponse.json(
						createPagedResult(filtered, { page: 1, totalPages: 1, totalCount: filtered.length })
					)
				})
			)
			renderSeriesList()
			await waitFor(() => expect(screen.getByText('Breaking Bad')).toBeInTheDocument())

			const input = screen.getByRole('textbox')
			fireEvent.change(input, { target: { value: 'B' } })
			fireEvent.change(input, { target: { value: 'Be' } })
			fireEvent.change(input, { target: { value: 'Bet' } })
			fireEvent.change(input, { target: { value: 'Bett' } })

			await waitFor(() => expect(screen.queryByText('Breaking Bad')).not.toBeInTheDocument())
			expect(searchRequests).toBe(1)
		})

		it('commits the search when pressing Enter without reloading', async () => {
			renderSeriesList()
			await waitFor(() => expect(screen.getByText('Breaking Bad')).toBeInTheDocument())

			const input = screen.getByRole('textbox')
			fireEvent.change(input, { target: { value: 'Wire' } })
			fireEvent.submit(input.closest('form') as HTMLFormElement)

			await waitFor(() => expect(screen.getByTestId('search-params')).toHaveTextContent('q=Wire'))
			await waitFor(() => expect(screen.queryByText('Breaking Bad')).not.toBeInTheDocument())
			expect(screen.getByText('The Wire')).toBeInTheDocument()
		})
	})
})
