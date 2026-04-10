import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { PublicRoute } from '@/components/Auth/PublicRoute'
import { createTestStore } from '@/test/utils/createTestStore'

const authenticatedState = {
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
			profiles: [],
			activeProfileId: null,
		},
		loading: false,
		error: null,
	},
}

const unauthenticatedState = {
	auth: {
		isAuthenticated: false,
		token: null,
		user: null,
		loading: false,
		error: null,
	},
}

function renderRoutes(preloadedState: any, initialRoute = '/') {
	const store = createTestStore(preloadedState)
	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[initialRoute]}>
				<Routes>
					<Route path='/login' element={<div>Login Page</div>} />
					<Route
						path='/'
						element={
							<ProtectedRoute>
								<div>Protected Content</div>
							</ProtectedRoute>
						}
					/>
					<Route
						path='/public'
						element={
							<PublicRoute>
								<div>Public Content</div>
							</PublicRoute>
						}
					/>
				</Routes>
			</MemoryRouter>
		</Provider>
	)
}

describe('ProtectedRoute', () => {
	it('renders children when authenticated', () => {
		renderRoutes(authenticatedState)
		expect(screen.getByText('Protected Content')).toBeInTheDocument()
	})

	it('redirects to /login when not authenticated', () => {
		renderRoutes(unauthenticatedState)
		expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
		expect(screen.getByText('Login Page')).toBeInTheDocument()
	})
})

describe('PublicRoute', () => {
	it('renders children when not authenticated', () => {
		renderRoutes(unauthenticatedState, '/public')
		expect(screen.getByText('Public Content')).toBeInTheDocument()
	})

	it('redirects to / when authenticated', () => {
		renderRoutes(authenticatedState, '/public')
		expect(screen.queryByText('Public Content')).not.toBeInTheDocument()
	})
})

describe('ProtectedRoute – edge cases', () => {
	it('does not render login page when authenticated', () => {
		renderRoutes(authenticatedState)
		expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
	})

	it('renders protected content without flickering', () => {
		renderRoutes(authenticatedState)
		const content = screen.getByText('Protected Content')
		expect(content).toBeVisible()
	})
})

describe('PublicRoute – edge cases', () => {
	it('renders login page for unauthenticated users on /login', () => {
		renderRoutes(unauthenticatedState, '/login')
		expect(screen.getByText('Login Page')).toBeInTheDocument()
	})

	it('does not render public content when authenticated and navigating to /public', () => {
		renderRoutes(authenticatedState, '/public')
		expect(screen.queryByText('Public Content')).not.toBeInTheDocument()
	})
})
