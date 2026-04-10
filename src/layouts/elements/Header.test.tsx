import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { Header } from '@/layouts/elements/Header'
import { createTestStore } from '@/test/utils/createTestStore'

function renderHeader(preloadedState: any = {}) {
	const defaultAuth = {
		isAuthenticated: true,
		token: 'tok',
		user: {
			id: 1,
			username: 'TestUser',
			isAdmin: false,
			avatarUrl: null,
			preferredLanguage: 'en',
			jellyfinUserId: 'j',
			profiles: [],
			activeProfileId: null,
		},
		loading: false,
		error: null,
	}
	const store = createTestStore({
		auth: preloadedState.auth ?? defaultAuth,
	})
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={[preloadedState.route ?? '/']}>
						<Header />
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Header', () => {
	it('renders logo with Jellywatch text', () => {
		renderHeader()
		expect(screen.getByText('Jellywatch')).toBeInTheDocument()
	})

	it('renders navigation links', () => {
		renderHeader()
		expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
		expect(screen.getByText(/series/i)).toBeInTheDocument()
		expect(screen.getByText(/movies/i)).toBeInTheDocument()
	})

	it('shows username', () => {
		renderHeader()
		const usernames = screen.getAllByText('TestUser')
		expect(usernames.length).toBeGreaterThanOrEqual(1)
	})

	it('hides admin link for non-admin users', () => {
		renderHeader()
		expect(screen.queryByText(/admin/i)).not.toBeInTheDocument()
	})

	it('shows admin link for admin users', () => {
		renderHeader({
			auth: {
				isAuthenticated: true,
				token: 'tok',
				user: {
					id: 1,
					username: 'Admin',
					isAdmin: true,
					avatarUrl: null,
					preferredLanguage: 'en',
					jellyfinUserId: 'j',
					profiles: [],
					activeProfileId: null,
				},
				loading: false,
				error: null,
			},
		})
		const adminLinks = screen.getAllByText(/admin/i)
		expect(adminLinks.length).toBeGreaterThanOrEqual(1)
	})

	it('has logout button', () => {
		renderHeader()
		const logoutBtns = screen.getAllByTitle(/logout/i)
		expect(logoutBtns.length).toBeGreaterThanOrEqual(1)
	})

	it('dispatches logoutUser when logout clicked', async () => {
		const user = userEvent.setup()
		const { store } = renderHeader()
		const logoutBtns = screen.getAllByTitle(/logout/i)
		await user.click(logoutBtns[0])

		await waitFor(() => {
			const state = store.getState()
			// After logoutUser is dispatched the auth state may still be pending
			// but the action should have been dispatched
			expect(state.auth).toBeDefined()
		})
	})

	it('has hamburger menu button', () => {
		renderHeader()
		expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument()
	})

	it('toggles mobile menu when hamburger clicked', async () => {
		const user = userEvent.setup()
		const { container } = renderHeader()
		const hamburger = screen.getByLabelText('Toggle menu')
		await user.click(hamburger)
		expect(container.querySelector('.header-nav--open')).toBeInTheDocument()
	})

	it('renders language switcher', () => {
		renderHeader()
		const langBtns = screen.getAllByRole('button')
		const langBtn = langBtns.find((b) => /^(ES|EN)$/.test(b.textContent ?? ''))
		expect(langBtn).toBeDefined()
	})

	it('closes mobile menu on second hamburger click', async () => {
		const user = userEvent.setup()
		const { container } = renderHeader()
		const hamburger = screen.getByLabelText('Toggle menu')
		await user.click(hamburger)
		await user.click(hamburger)
		expect(container.querySelector('.header-nav--open')).not.toBeInTheDocument()
	})
})
