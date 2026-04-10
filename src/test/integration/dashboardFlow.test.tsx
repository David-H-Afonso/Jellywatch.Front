import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createTestStore } from '@/test/utils/createTestStore'
import Dashboard from '@/components/Dashboard/Dashboard'
import { createProfileDetailDto, createActivityDto, createPagedResult } from '@/test/factories'

vi.mock('@/services/AdminService/AdminService', () => ({
	triggerMineSync: vi.fn().mockResolvedValue(undefined),
}))

const API = 'http://localhost:5011'

const profileDetail = createProfileDetailDto({
	id: 10,
	displayName: 'Main',
	totalSeriesWatching: 5,
	totalSeriesCompleted: 20,
	totalMoviesSeen: 50,
	totalEpisodesSeen: 1200,
})

const mockActivity = [
	createActivityDto({
		id: 1,
		mediaTitle: 'Breaking Bad',
		episodeName: 'Pilot',
		seasonNumber: 1,
		episodeNumber: 1,
	}),
	createActivityDto({
		id: 2,
		mediaTitle: 'Inception',
		episodeName: null,
		seasonNumber: null,
		episodeNumber: null,
	}),
]

const authState = {
	auth: {
		isAuthenticated: true,
		token: 'tok',
		user: {
			id: 1,
			username: 'TestUser',
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

function renderDashboard() {
	const store = createTestStore(authState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/']}>
						<Routes>
							<Route path='/' element={<Dashboard />} />
							<Route path='/series/:id' element={<div>Series Detail</div>} />
							<Route path='/movies/:id' element={<div>Movie Detail</div>} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Dashboard Flow', () => {
	beforeEach(() => {
		server.use(
			http.get(`${API}/api/profile/:id`, () => {
				return HttpResponse.json(profileDetail)
			}),
			http.get(`${API}/api/profile/:id/activity`, () => {
				return HttpResponse.json(createPagedResult(mockActivity))
			}),
			http.get(`${API}/api/stats/:id/upcoming`, () => {
				return HttpResponse.json([])
			})
		)
	})

	it('shows welcome message with username', async () => {
		renderDashboard()
		await waitFor(() => {
			expect(screen.getByText(/TestUser/)).toBeInTheDocument()
		})
	})

	it('loads and displays profile stats', async () => {
		renderDashboard()
		await waitFor(() => {
			expect(screen.getByText('5')).toBeInTheDocument() // seriesWatching
		})
		expect(screen.getByText('20')).toBeInTheDocument() // seriesCompleted
		expect(screen.getByText('50')).toBeInTheDocument() // moviesSeen
		expect(screen.getByText('1200')).toBeInTheDocument() // episodesSeen
	})

	it('displays recent activity items', async () => {
		renderDashboard()
		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		expect(screen.getByText('Inception')).toBeInTheDocument()
	})

	it('shows episode info in activity items', async () => {
		renderDashboard()
		await waitFor(() => {
			expect(screen.getByText(/S1E1/)).toBeInTheDocument()
		})
		expect(screen.getByText(/Pilot/)).toBeInTheDocument()
	})

	it('fetches profile detail on mount', async () => {
		const { store } = renderDashboard()
		await waitFor(() => {
			const state = store.getState()
			expect(state.profile.currentProfile).toBeTruthy()
			expect(state.profile.currentProfile?.totalSeriesWatching).toBe(5)
		})
	})

	it('shows no activity message when empty', async () => {
		server.use(
			http.get(`${API}/api/profile/:id/activity`, () => {
				return HttpResponse.json(createPagedResult([]))
			})
		)
		renderDashboard()
		await waitFor(() => {
			const emptyState = document.querySelector('.empty-state')
			expect(emptyState).toBeInTheDocument()
		})
	})

	it('includes profile selector', () => {
		renderDashboard()
		// ProfileSelector renders a SyncButton
		const buttons = screen.getAllByRole('button')
		expect(buttons.length).toBeGreaterThanOrEqual(1)
	})
})
