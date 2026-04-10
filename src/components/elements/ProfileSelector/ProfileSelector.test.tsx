import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { ProfileSelector } from '@/components/elements/ProfileSelector/ProfileSelector'
import { createTestStore } from '@/test/utils/createTestStore'

vi.mock('@/services/AdminService/AdminService', () => ({
	triggerMineSync: vi.fn().mockResolvedValue(undefined),
}))

function renderComponent() {
	const store = createTestStore({
		auth: {
			isAuthenticated: true,
			token: 'tok',
			user: {
				id: 1,
				username: 'user',
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
					<ProfileSelector />
				</MemoryRouter>
			</I18nextProvider>
		</Provider>
	)
}

describe('ProfileSelector', () => {
	it('renders sync button', () => {
		renderComponent()
		expect(screen.getByRole('button')).toBeInTheDocument()
	})

	it('has profile-selector class', () => {
		const { container } = renderComponent()
		expect(container.querySelector('.profile-selector')).toBeInTheDocument()
	})
})
