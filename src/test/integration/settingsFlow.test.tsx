import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createTestStore } from '@/test/utils/createTestStore'
import Settings from '@/components/Settings/Settings'
import { createProviderSettingsDto, createPropagationRuleDto } from '@/test/factories'

vi.mock('@/services/AdminService/AdminService', () => ({
	triggerMineSync: vi.fn().mockResolvedValue(undefined),
	getAllProfiles: vi.fn().mockResolvedValue([
		{ id: 10, displayName: 'Main', jellyfinUserId: 'j1' },
		{ id: 20, displayName: 'Secondary', jellyfinUserId: 'j2' },
	]),
	rePropagate: vi.fn().mockResolvedValue(undefined),
}))

const API = 'http://localhost:5011'

const mockProviders = createProviderSettingsDto({
	tmdbHasApiKey: true,
	omdbHasApiKey: false,
	primaryLanguage: 'en',
	fallbackLanguage: 'es',
})

const mockRules = [
	createPropagationRuleDto({
		id: 1,
		sourceProfileName: 'Main',
		targetProfileName: 'Secondary',
		isActive: true,
	}),
]

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

function renderSettings() {
	server.use(
		http.get(`${API}/api/settings/providers`, () => HttpResponse.json(mockProviders)),
		http.get(`${API}/api/settings/propagation`, () => HttpResponse.json(mockRules))
	)
	const store = createTestStore(authState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/settings']}>
						<Routes>
							<Route path='/settings' element={<Settings />} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Settings Flow', () => {
	it('renders page heading', async () => {
		renderSettings()
		await waitFor(() => {
			expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
		})
	})

	it('shows provider status', async () => {
		renderSettings()
		await waitFor(() => {
			expect(screen.getByText('TMDB')).toBeInTheDocument()
			expect(screen.getByText('OMDb')).toBeInTheDocument()
			expect(screen.getByText('TVmaze')).toBeInTheDocument()
		})
	})

	it('shows TMDB as configured', async () => {
		renderSettings()
		await waitFor(() => {
			const badges = document.querySelectorAll('.provider-status__badge--ok')
			expect(badges.length).toBeGreaterThanOrEqual(1)
		})
	})

	it('shows OMDb as not configured', async () => {
		renderSettings()
		await waitFor(() => {
			const missingBadges = document.querySelectorAll('.provider-status__badge--missing')
			expect(missingBadges.length).toBeGreaterThanOrEqual(1)
		})
	})

	it('shows language settings', async () => {
		renderSettings()
		await waitFor(() => {
			expect(screen.getByText('en')).toBeInTheDocument()
			expect(screen.getByText('es')).toBeInTheDocument()
		})
	})

	it('shows propagation rules table', async () => {
		renderSettings()
		await waitFor(() => {
			// Rules table should show source and target profile names
			const table = document.querySelector('.rules-table')
			expect(table).toBeInTheDocument()
		})
	})

	it('shows active/inactive toggle for rules', async () => {
		renderSettings()
		await waitFor(() => {
			const toggleBtns = document.querySelectorAll('.toggle-btn')
			expect(toggleBtns.length).toBeGreaterThanOrEqual(1)
		})
	})

	it('shows add rule form with profile dropdowns', async () => {
		renderSettings()
		await waitFor(() => {
			const selects = screen.getAllByRole('combobox')
			expect(selects.length).toBeGreaterThanOrEqual(2)
		})
	})

	it('stores settings in Redux', async () => {
		const { store } = renderSettings()
		await waitFor(() => {
			const state = store.getState()
			expect(state.settings.providers).not.toBeNull()
			expect(state.settings.propagationRules.length).toBe(1)
		})
	})

	it('shows re-propagate button for admin', async () => {
		renderSettings()
		await waitFor(() => {
			const buttons = screen.getAllByRole('button')
			const rePropBtn = buttons.find((b) => b.textContent?.match(/propagat/i))
			expect(rePropBtn).toBeDefined()
		})
	})
})
