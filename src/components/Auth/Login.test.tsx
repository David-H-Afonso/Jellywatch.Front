import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { Login } from '@/components/Auth/Login'
import { createTestStore } from '@/test/utils/createTestStore'
import { createAuthState } from '@/test/factories'

vi.mock('@/services/AdminService/AdminService', () => ({
	triggerMineSync: vi.fn(() => Promise.resolve()),
}))

function renderLogin(preloadedState = {}) {
	const store = createTestStore(preloadedState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter>
						<Login />
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Login', () => {
	it('renders login form with server URL, username, password fields', () => {
		renderLogin()
		expect(screen.getByLabelText('Server URL')).toBeInTheDocument()
		expect(screen.getByLabelText('Username')).toBeInTheDocument()
		expect(screen.getByLabelText('Password')).toBeInTheDocument()
	})

	it('renders Jellywatch title', () => {
		renderLogin()
		expect(screen.getByText('Jellywatch')).toBeInTheDocument()
	})

	it('renders Sign In button', () => {
		renderLogin()
		expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
	})

	it('shows error message when auth error exists', () => {
		renderLogin({ auth: createAuthState({ error: 'Invalid credentials' }) })
		expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
	})

	it('disables submit button while loading', () => {
		renderLogin({ auth: createAuthState({ loading: true }) })
		expect(screen.getByRole('button', { name: 'Connecting...' })).toBeDisabled()
	})

	it('allows typing in all fields', async () => {
		const user = userEvent.setup()
		renderLogin()

		const serverInput = screen.getByLabelText('Server URL')
		const usernameInput = screen.getByLabelText('Username')
		const passwordInput = screen.getByLabelText('Password')

		await user.clear(serverInput)
		await user.type(serverInput, 'http://myserver:8096')
		await user.type(usernameInput, 'admin')
		await user.type(passwordInput, 'secret')

		expect(serverInput).toHaveValue('http://myserver:8096')
		expect(usernameInput).toHaveValue('admin')
		expect(passwordInput).toHaveValue('secret')
	})

	it('password field has type password', () => {
		renderLogin()
		const pwd = screen.getByLabelText('Password')
		expect(pwd).toHaveAttribute('type', 'password')
	})

	it('submit button is enabled by default', () => {
		renderLogin()
		expect(screen.getByRole('button', { name: 'Sign In' })).not.toBeDisabled()
	})

	it('shows loading text on button while authenticating', () => {
		renderLogin({ auth: createAuthState({ loading: true }) })
		expect(screen.getByText('Connecting...')).toBeInTheDocument()
	})

	it('clears error when re-rendering without error', () => {
		const { rerender } = render(
			<Provider store={createTestStore({ auth: createAuthState({ error: 'fail' }) })}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter>
						<Login />
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		)
		expect(screen.getByText('fail')).toBeInTheDocument()

		rerender(
			<Provider store={createTestStore({ auth: createAuthState({ error: null }) })}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter>
						<Login />
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		)
		expect(screen.queryByText('fail')).not.toBeInTheDocument()
	})

	it('has a form element', () => {
		const { container } = renderLogin()
		expect(container.querySelector('form')).toBeInTheDocument()
	})
})
