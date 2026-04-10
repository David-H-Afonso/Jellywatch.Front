import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createTestStore } from '@/test/utils/createTestStore'
import Activity from '@/components/Activity/Activity'
import { createActivityDto, createPagedResult } from '@/test/factories'
import { MediaType, WatchEventType } from '@/models/api/Enums'

vi.mock('@/services/AdminService/AdminService', () => ({
	triggerMineSync: vi.fn().mockResolvedValue(undefined),
}))

const API = 'http://localhost:5011'

function buildActivity() {
	return [
		createActivityDto({
			id: 1,
			mediaTitle: 'Breaking Bad',
			episodeName: 'Pilot',
			seasonNumber: 1,
			episodeNumber: 1,
			eventType: WatchEventType.Finished,
			mediaType: MediaType.Series,
			seriesId: 100,
			movieId: null,
		}),
		createActivityDto({
			id: 2,
			mediaTitle: 'Inception',
			episodeName: null,
			seasonNumber: null,
			episodeNumber: null,
			eventType: WatchEventType.Finished,
			mediaType: MediaType.Movie,
			seriesId: null,
			movieId: 200,
		}),
		createActivityDto({
			id: 3,
			mediaTitle: 'The Wire',
			episodeName: 'The Target',
			seasonNumber: 1,
			episodeNumber: 1,
			eventType: WatchEventType.Removed,
			mediaType: MediaType.Series,
			seriesId: 300,
			movieId: null,
		}),
	]
}

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

function renderActivity() {
	const store = createTestStore(authState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/activity']}>
						<Routes>
							<Route path='/activity' element={<Activity />} />
							<Route path='/series/:id' element={<div>Series Detail</div>} />
							<Route path='/movies/:id' element={<div>Movie Detail</div>} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Activity Flow', () => {
	beforeEach(() => {
		server.use(
			http.get(`${API}/api/profile/:id/activity`, () => {
				return HttpResponse.json(
					createPagedResult(buildActivity(), { page: 1, totalPages: 2, totalCount: 25 })
				)
			})
		)
	})

	it('loads and displays activity items', async () => {
		renderActivity()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		expect(screen.getByText('Inception')).toBeInTheDocument()
		expect(screen.getByText('The Wire')).toBeInTheDocument()
	})

	it('shows episode info for series activity', async () => {
		renderActivity()
		await waitFor(() => {
			expect(screen.getByText(/Pilot/)).toBeInTheDocument()
		})
		expect(screen.getAllByText(/S1E1/).length).toBeGreaterThanOrEqual(1)
	})

	it('shows page heading', async () => {
		renderActivity()
		await waitFor(() => {
			expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
		})
	})

	it('stores activity in Redux', async () => {
		const { store } = renderActivity()
		await waitFor(() => {
			const state = store.getState()
			expect(state.profile.activity.length).toBe(3)
		})
	})

	it('shows pagination when multiple pages', async () => {
		renderActivity()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		// Pagination component should be present
		const pagination = document.querySelector('.pagination')
		expect(pagination).toBeInTheDocument()
	})

	it('shows empty state when no activity', async () => {
		server.use(
			http.get(`${API}/api/profile/:id/activity`, () => {
				return HttpResponse.json(createPagedResult([], { page: 1, totalPages: 0, totalCount: 0 }))
			})
		)
		renderActivity()
		await waitFor(() => {
			const emptyState = document.querySelector('.empty-state')
			expect(emptyState).toBeInTheDocument()
		})
	})

	it('has filter controls', async () => {
		renderActivity()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		// Should render search input and filter selects
		const searchInput = screen.getByRole('textbox')
		expect(searchInput).toBeInTheDocument()
		const selects = screen.getAllByRole('combobox')
		expect(selects.length).toBeGreaterThanOrEqual(2)
	})

	it('has date preset buttons', async () => {
		renderActivity()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		// Date preset buttons: all, 7d, 30d, 90d, custom
		const buttons = screen.getAllByRole('button')
		expect(buttons.length).toBeGreaterThanOrEqual(5)
	})

	it('renders watch state badges for each item', async () => {
		renderActivity()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		// WatchStateBadge components should be present
		const badges = document.querySelectorAll('.watch-state-badge')
		expect(badges.length).toBe(3)
	})
})
