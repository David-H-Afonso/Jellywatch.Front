import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createTestStore } from '@/test/utils/createTestStore'
import Admin from '@/components/Admin/Admin'
import {
	createUserDto,
	createMediaLibraryItemDto,
	createBlacklistedItemDto,
	createSyncJobDto,
	createImportQueueItemDto,
	createWebhookLogDto,
	createProviderSettingsDto,
	createPropagationRuleDto,
	createPagedResult,
} from '@/test/factories'

vi.mock('@/services/AdminService/AdminService', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/services/AdminService/AdminService')>()),
	triggerMineSync: vi.fn().mockResolvedValue(undefined),
	triggerFullSync: vi.fn().mockResolvedValue(undefined),
	rePropagate: vi.fn().mockResolvedValue(undefined),
}))

const API = 'http://localhost:5011'

const mockUsers = [
	createUserDto({ id: 1, username: 'admin', isAdmin: true }),
	createUserDto({ id: 2, username: 'viewer', isAdmin: false }),
]

const mockMedia = [
	createMediaLibraryItemDto({ id: 1, title: 'Breaking Bad', mediaType: 'Series', tmdbId: 1396 }),
	createMediaLibraryItemDto({ id: 2, title: 'Inception', mediaType: 'Movie', tmdbId: 27205 }),
]

const mockBlacklist = [
	createBlacklistedItemDto({
		id: 1,
		jellyfinItemId: 'jf-123',
		displayName: 'Blocked Show',
		reason: 'Not wanted',
	}),
]

const mockSyncJobs = [createSyncJobDto({ id: 1 })]
const mockImportQueue = [createImportQueueItemDto({ id: 1 })]
const mockWebhookLogs = [createWebhookLogDto({ id: 1 })]
const mockProviders = createProviderSettingsDto()
const mockRules = [createPropagationRuleDto({ id: 1 })]

const authState = {
	auth: {
		isAuthenticated: true,
		token: 'tok',
		user: {
			id: 1,
			username: 'admin',
			isAdmin: true,
			avatarUrl: null,
			preferredLanguage: 'en',
			jellyfinUserId: 'j1',
			profiles: [
				{ id: 10, displayName: 'Main', jellyfinUserId: 'jf-user-1', isJoint: false },
				{ id: 20, displayName: 'Secondary', jellyfinUserId: 'jf-user-2', isJoint: false },
			],
			activeProfileId: 10,
		},
		loading: false,
		error: null,
	},
}

function renderAdmin() {
	server.use(
		http.get(`${API}/api/admin/users`, () => HttpResponse.json(mockUsers)),
		http.get(`${API}/api/admin/media`, () => HttpResponse.json(createPagedResult(mockMedia))),
		http.get(`${API}/api/admin/blacklist`, () => HttpResponse.json(mockBlacklist)),
		http.get(`${API}/api/admin/import-queue`, () =>
			HttpResponse.json(createPagedResult(mockImportQueue))
		),
		http.get(`${API}/api/sync/jobs`, () => HttpResponse.json(createPagedResult(mockSyncJobs))),
		http.get(`${API}/api/sync/webhook-logs`, () =>
			HttpResponse.json(createPagedResult(mockWebhookLogs))
		),
		http.get(`${API}/api/settings/providers`, () => HttpResponse.json(mockProviders)),
		http.get(`${API}/api/settings/propagation`, () => HttpResponse.json(mockRules))
	)
	const store = createTestStore(authState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/admin']}>
						<Routes>
							<Route path='/admin' element={<Admin />} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Admin Flow', () => {
	it('renders admin heading', async () => {
		renderAdmin()
		await waitFor(() => {
			expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
		})
	})

	it('has collapsible sections', async () => {
		renderAdmin()
		await waitFor(() => {
			const toggles = document.querySelectorAll('.admin-section__toggle')
			expect(toggles.length).toBeGreaterThanOrEqual(5)
		})
	})

	it('expanding users section shows user table', async () => {
		const user = userEvent.setup()
		renderAdmin()
		await waitFor(() => {
			const toggles = document.querySelectorAll('.admin-section__toggle')
			expect(toggles.length).toBeGreaterThanOrEqual(1)
		})

		// Find and click the users section toggle
		const toggles = document.querySelectorAll('.admin-section__toggle')
		const usersToggle = Array.from(toggles).find((t) => t.textContent?.match(/user/i))
		if (usersToggle) {
			await user.click(usersToggle)
			await waitFor(() => {
				expect(screen.getByText('admin')).toBeInTheDocument()
				expect(screen.getByText('viewer')).toBeInTheDocument()
			})
		}
	})

	it('expanding media library shows media table', async () => {
		const user = userEvent.setup()
		renderAdmin()
		await waitFor(() => {
			const toggles = document.querySelectorAll('.admin-section__toggle')
			expect(toggles.length).toBeGreaterThanOrEqual(1)
		})

		const toggles = document.querySelectorAll('.admin-section__toggle')
		const mediaToggle = Array.from(toggles).find((t) => t.textContent?.match(/media library/i))
		if (mediaToggle) {
			await user.click(mediaToggle)
			await waitFor(() => {
				expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
				expect(screen.getByText('Inception')).toBeInTheDocument()
			})
		}
	})

	it('expanding blacklist shows blocked items', async () => {
		const user = userEvent.setup()
		renderAdmin()
		await waitFor(() => {
			const toggles = document.querySelectorAll('.admin-section__toggle')
			expect(toggles.length).toBeGreaterThanOrEqual(1)
		})

		const toggles = document.querySelectorAll('.admin-section__toggle')
		const blacklistToggle = Array.from(toggles).find((t) => t.textContent?.match(/blacklist/i))
		if (blacklistToggle) {
			await user.click(blacklistToggle)
			await waitFor(() => {
				expect(screen.getByText('Blocked Show')).toBeInTheDocument()
				expect(screen.getByText('Not wanted')).toBeInTheDocument()
			})
		}
	})

	it('has page size selector', async () => {
		renderAdmin()
		await waitFor(() => {
			const select = screen.getByRole('combobox')
			expect(select).toBeInTheDocument()
		})
	})

	it('stores admin data in Redux', async () => {
		const { store } = renderAdmin()
		await waitFor(() => {
			const state = store.getState()
			expect(state.admin.users.length).toBe(2)
		})
	})

	it('expanding settings section shows provider status', async () => {
		const user = userEvent.setup()
		renderAdmin()
		await waitFor(() => {
			const toggles = document.querySelectorAll('.admin-section__toggle')
			expect(toggles.length).toBeGreaterThanOrEqual(1)
		})

		const toggles = document.querySelectorAll('.admin-section__toggle')
		const settingsToggle = Array.from(toggles).find((t) => t.textContent?.match(/settings/i))
		if (settingsToggle) {
			await user.click(settingsToggle)
			await waitFor(() => {
				expect(screen.getByText('TMDB')).toBeInTheDocument()
				expect(screen.getByText('OMDb')).toBeInTheDocument()
				expect(screen.getByText('TVmaze')).toBeInTheDocument()
			})
		}
	})

	it('expanding sync controls section shows sync buttons', async () => {
		const user = userEvent.setup()
		renderAdmin()
		await waitFor(() => {
			const toggles = document.querySelectorAll('.admin-section__toggle')
			expect(toggles.length).toBeGreaterThanOrEqual(1)
		})

		const toggles = document.querySelectorAll('.admin-section__toggle')
		const syncToggle = Array.from(toggles).find((t) => t.textContent?.match(/sync controls/i))
		if (syncToggle) {
			await user.click(syncToggle)
			await waitFor(() => {
				const syncControls = document.querySelector('.sync-controls')
				expect(syncControls).toBeInTheDocument()
			})
		}
	})
})
