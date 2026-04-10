import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { AppLayout } from '@/layouts/AppLayout'
import { createTestStore } from '@/test/utils/createTestStore'

function renderAppLayout(children: React.ReactNode = <div>Page Content</div>) {
	const store = createTestStore({
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
				profiles: [],
				activeProfileId: null,
			},
			loading: false,
			error: null,
		},
	})
	return render(
		<Provider store={store}>
			<I18nextProvider i18n={i18n}>
				<MemoryRouter>
					<AppLayout>{children}</AppLayout>
				</MemoryRouter>
			</I18nextProvider>
		</Provider>
	)
}

describe('AppLayout', () => {
	it('renders header', () => {
		renderAppLayout()
		expect(screen.getByText('Jellywatch')).toBeInTheDocument()
	})

	it('renders children in main area', () => {
		renderAppLayout(<div>My Page Content</div>)
		expect(screen.getByText('My Page Content')).toBeInTheDocument()
	})

	it('has app-layout class', () => {
		const { container } = renderAppLayout()
		expect(container.querySelector('.app-layout')).toBeInTheDocument()
	})

	it('children are inside main element', () => {
		renderAppLayout(<div>Inside Main</div>)
		const main = screen.getByRole('main')
		expect(main).toBeInTheDocument()
		expect(main.textContent).toContain('Inside Main')
	})
})
