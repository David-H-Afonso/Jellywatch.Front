import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HouseholdAuthorize from './HouseholdAuthorize'
import { parseHouseholdAuthorizationRequest } from './householdAuthorizationRequest'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { createAuthState, createProfileInfo } from '@/test/factories'
import { customFetch } from '@/utils/customFetch'

vi.mock('@/utils/customFetch', () => ({ customFetch: vi.fn() }))

const validSearch = new URLSearchParams({
	client_id: 'household',
	redirect_uri: 'https://household.test/api/integrations/callback/provider',
	state: 'unguessable-state-value-123456',
	code_challenge: 'A'.repeat(43),
	code_challenge_method: 'S256',
	scope: 'profile.read activity.read media.rating.write',
}).toString()

describe('Household authorization request', () => {
	it('parses only the public PKCE request and supported scopes', () => {
		expect(parseHouseholdAuthorizationRequest(`?${validSearch}`)).toEqual({
			clientId: 'household',
			redirectUri: 'https://household.test/api/integrations/callback/provider',
			state: 'unguessable-state-value-123456',
			codeChallenge: 'A'.repeat(43),
			codeChallengeMethod: 'S256',
			scopes: ['profile.read', 'activity.read', 'media.rating.write'],
		})
	})

	it('rejects unsupported scopes and non-S256 requests', () => {
		const unsupported = new URLSearchParams(validSearch)
		unsupported.set('scope', 'admin.read')
		const plain = new URLSearchParams(validSearch)
		plain.set('code_challenge_method', 'plain')
		expect(parseHouseholdAuthorizationRequest(`?${unsupported}`)).toBeNull()
		expect(parseHouseholdAuthorizationRequest(`?${plain}`)).toBeNull()
	})
})

describe('HouseholdAuthorize', () => {
	beforeEach(() => {
		vi.mocked(customFetch).mockReset()
		vi.mocked(customFetch).mockRejectedValue(new Error('stop before navigation'))
	})

	it('shows account, requested scopes, and an owned profile selector', () => {
		renderConsent()

		expect(screen.getByText('testuser')).toBeInTheDocument()
		expect(screen.getByLabelText('Alice profile')).toBeChecked()
		expect(screen.getByLabelText('Shared profile')).not.toBeChecked()
		expect(screen.getByText('Recent activity')).toBeInTheDocument()
		expect(screen.getByText('Update ratings')).toBeInTheDocument()
		expect(screen.queryByText(/access token|refresh token/i)).not.toBeInTheDocument()
	})

	it('submits the selected profile with approval and never handles integration tokens', async () => {
		const user = userEvent.setup()
		renderConsent()
		await user.click(screen.getByLabelText('Shared profile'))
		await user.click(screen.getByRole('button', { name: 'Approve connection' }))

		await waitFor(() => expect(customFetch).toHaveBeenCalledOnce())
		const options = vi.mocked(customFetch).mock.calls[0][1]
		expect(options?.body).toMatchObject({ approved: true, profileId: 22 })
		expect(JSON.stringify(options?.body)).not.toMatch(/accessToken|refreshToken/i)
	})

	it('sends denial through the API so the redirect is server-validated', async () => {
		const user = userEvent.setup()
		renderConsent()
		await user.click(screen.getByRole('button', { name: 'Deny' }))

		await waitFor(() => expect(customFetch).toHaveBeenCalledOnce())
		expect(vi.mocked(customFetch).mock.calls[0][1]?.body).toMatchObject({
			approved: false,
			profileId: null,
		})
	})
})

function renderConsent() {
	const profiles = [
		createProfileInfo({ id: 11, displayName: 'Alice profile' }),
		createProfileInfo({ id: 22, displayName: 'Shared profile', isJoint: true }),
	]
	return renderWithProviders(<HouseholdAuthorize />, {
		route: `/integrations/household/authorize?${validSearch}`,
		preloadedState: {
			auth: createAuthState({
				user: {
					id: 1,
					username: 'testuser',
					isAdmin: false,
					avatarUrl: null,
					preferredLanguage: 'en',
					jellyfinUserId: 'jf-user-1',
					profiles,
					activeProfileId: 11,
				},
			}),
		},
	})
}
