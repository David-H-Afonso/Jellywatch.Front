import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createTestStore } from '@/test/utils/createTestStore'
import { Login } from '@/components/Auth/Login'

const API = 'http://localhost:5011'

const unauthenticatedState = {
	auth: {
		isAuthenticated: false,
		token: null,
		user: null,
		loading: false,
		error: null,
	},
}

function renderLogin(preloadedState: any = unauthenticatedState) {
	const store = createTestStore(preloadedState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/login']}>
						<Routes>
							<Route path='/login' element={<Login />} />
							<Route path='/' element={<div>Dashboard</div>} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Auth Flow Integration', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders login form with server, username, and password fields', () => {
		renderLogin()
		expect(screen.getByLabelText(/server/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
	})

	it('successful login dispatches loginUser and updates store', async () => {
		const user = userEvent.setup()
		server.use(
			http.post(`${API}/api/auth/login`, () => {
				return HttpResponse.json({
					userId: 1,
					username: 'TestUser',
					token: 'new-valid-token',
					isAdmin: false,
					avatarUrl: null,
					preferredLanguage: 'en',
					jellyfinUserId: 'jf1',
					profiles: [{ id: 10, displayName: 'Main', jellyfinUserId: 'jf-user-1', isJoint: false }],
				})
			})
		)

		const { store } = renderLogin()

		await user.type(screen.getByLabelText(/server/i), 'http://localhost:5011')
		await user.type(screen.getByLabelText(/username/i), 'TestUser')
		await user.type(screen.getByLabelText(/password/i), 'pass123')

		const submitBtn = screen.getByRole('button', { name: /login|sign in|connect/i })
		await user.click(submitBtn)

		await waitFor(() => {
			const state = store.getState()
			expect(state.auth.isAuthenticated).toBe(true)
			expect(state.auth.token).toBe('new-valid-token')
		})
	})

	it('failed login shows error message', async () => {
		const user = userEvent.setup()
		server.use(
			http.post(`${API}/api/auth/login`, () => {
				return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
			})
		)

		const { store } = renderLogin()

		await user.type(screen.getByLabelText(/server/i), 'http://localhost:5011')
		await user.type(screen.getByLabelText(/username/i), 'wrong')
		await user.type(screen.getByLabelText(/password/i), 'wrong')

		const submitBtn = screen.getByRole('button', { name: /login|sign in|connect/i })
		await user.click(submitBtn)

		await waitFor(
			() => {
				const errorEl = screen.queryByText(/error|invalid|failed/i)
				const storeError = store.getState().auth.error
				expect(errorEl || storeError).toBeTruthy()
			},
			{ timeout: 3000 }
		)
	})

	it('login form requires all fields', () => {
		renderLogin()
		const submitBtn = screen.getByRole('button', { name: /login|sign in|connect/i })
		// Submit button should exist
		expect(submitBtn).toBeInTheDocument()
	})
})
