const watchlistIndex = {
	watchlists: [
		{
			id: 1,
			name: 'Weekly queue',
			description: 'What we are watching this week',
			state: 0,
			ownerUserId: 1,
			ownerUsername: 'TestUser',
			role: 0,
			permissions: {
				canAddItems: true,
				canRemoveItems: true,
				canReorderItems: true,
				canUpdateItemStatus: true,
				canInviteMembers: true,
				canManageMembers: true,
				canUpdateWatchlist: true,
				canDeleteWatchlist: true,
			},
			itemCount: 3,
			createdAt: '2025-01-01T00:00:00Z',
			updatedAt: '2025-01-01T00:00:00Z',
		},
	],
	pendingInvitations: [
		{
			id: 8,
			watchlistId: 3,
			watchlistName: 'Partner list',
			watchlistDescription: 'Shared queue',
			invitedByUserId: 2,
			invitedByUsername: 'Partner',
			role: 2,
			status: 0,
			createdAt: '2025-01-01T00:00:00Z',
			preview: {
				id: 3,
				name: 'Partner list',
				description: 'Shared queue',
				state: 0,
				hasFullAccess: false,
				canRequestAccess: false,
				items: [],
			},
		},
	],
	incomingAccessRequests: [],
	defaultWatchlistId: 1,
}

const watchlistDetail = {
	...watchlistIndex.watchlists[0],
	members: [
		{
			id: 1,
			userId: 1,
			username: 'TestUser',
			role: 0,
			permissions: watchlistIndex.watchlists[0].permissions,
			createdAt: '2025-01-01T00:00:00Z',
		},
		{
			id: 4,
			userId: 4,
			username: 'PartnerUser',
			role: 2,
			permissions: {
				canAddItems: true,
				canRemoveItems: false,
				canReorderItems: true,
				canUpdateItemStatus: true,
				canInviteMembers: false,
				canManageMembers: false,
				canUpdateWatchlist: false,
				canDeleteWatchlist: false,
			},
			createdAt: '2025-01-01T00:00:00Z',
		},
	],
	items: [
		{
			id: 10,
			itemType: 0,
			mediaItemId: 100,
			childWatchlistId: null,
			status: 0,
			position: 0,
			addedByUserId: 1,
			addedByUsername: 'TestUser',
			createdAt: '2025-01-01T00:00:00Z',
			updatedAt: '2025-01-01T00:00:00Z',
			media: {
				mediaItemId: 100,
				mediaType: 0,
				seriesId: 1000,
				movieId: null,
				title: 'House of the Dragon',
				originalTitle: null,
				posterPath: '/poster.jpg',
				releaseDate: '2024-01-01',
				isInProfile: true,
				isBlacklisted: false,
				canAddToProfile: false,
			},
			childWatchlist: null,
		},
		{
			id: 11,
			itemType: 0,
			mediaItemId: 101,
			childWatchlistId: null,
			status: 0,
			position: 1,
			addedByUserId: 1,
			addedByUsername: 'TestUser',
			createdAt: '2025-01-01T00:00:00Z',
			updatedAt: '2025-01-01T00:00:00Z',
			media: {
				mediaItemId: 101,
				mediaType: 0,
				seriesId: 1001,
				movieId: null,
				title: 'Rick and Morty',
				originalTitle: null,
				posterPath: '/rick.jpg',
				releaseDate: '2013-01-01',
				isInProfile: false,
				isBlacklisted: false,
				canAddToProfile: true,
			},
			childWatchlist: null,
		},
		{
			id: 12,
			itemType: 1,
			mediaItemId: null,
			childWatchlistId: 2,
			status: 3,
			position: 2,
			addedByUserId: 1,
			addedByUsername: 'TestUser',
			createdAt: '2025-01-01T00:00:00Z',
			updatedAt: '2025-01-01T00:00:00Z',
			media: null,
			childWatchlist: {
				id: 2,
				name: 'Lord of the Rings',
				description: 'Movies in order',
				state: 2,
				hasFullAccess: false,
				canRequestAccess: true,
				items: [
					{
						id: 21,
						itemType: 0,
						mediaItemId: 201,
						childWatchlistId: null,
						status: 0,
						position: 0,
						media: { title: 'The Fellowship of the Ring' },
					},
				],
			},
		},
	],
}

describe('Watchlists Journey', () => {
	beforeEach(() => {
		cy.login()
		cy.intercept('GET', '/api/auth/me', {
			body: {
				id: 1,
				username: 'TestUser',
				isAdmin: false,
				avatarUrl: null,
				preferredLanguage: 'en',
				jellyfinUserId: 'jf-user-1',
				profiles: [
					{ id: 10, displayName: 'Main', jellyfinUserId: 'jf-user-1', isJoint: false },
				],
			},
		}).as('me')
		cy.intercept('GET', '/api/watchlists?*', { body: watchlistIndex }).as('watchlists')
		cy.intercept('GET', '/api/watchlists/1?*', { body: watchlistDetail }).as('watchlistDetail')
		cy.intercept('GET', '/api/watchlists/users?*', { body: [] }).as('watchlistUsers')
		cy.intercept('GET', '/api/asset/*', { statusCode: 404 })
	})

	it('shows watchlists, pending invitations, and items', () => {
		cy.visit('/#/watchlists')
		cy.wait('@watchlists')
		cy.contains('Weekly queue').should('be.visible')
		cy.contains('Partner list').should('be.visible')
		cy.contains('House of the Dragon').should('be.visible')
		cy.contains('Rick and Morty').should('be.visible')
	})

	it('accepts an invitation without a real API', () => {
		cy.intercept('POST', '/api/watchlists/invitations/8/accept', { statusCode: 204 }).as('accept')
		cy.visit('/#/watchlists')
		cy.contains('button', 'Accept').click()
		cy.wait('@accept')
	})

	it('updates item status and manually reorders by number', () => {
		cy.intercept('PUT', '/api/watchlists/1/items/10', { statusCode: 204 }).as('updateItem')
		cy.visit('/#/watchlists')
		cy.contains('House of the Dragon').should('be.visible')
		cy.get('.watchlist-item').first().find('.watchlist-select__button').click()
		cy.get('.watchlist-select__menu').contains('button', 'Dropped').click()
		cy.wait('@updateItem')
		cy.get('.watchlist-item').first().find('input[type="number"]').clear().type('2')
		cy.wait('@updateItem')
	})

	it('adds missing media to the active profile from the watchlist', () => {
		cy.intercept('POST', '/api/profile/10/media/101', { statusCode: 204 }).as('addMedia')
		cy.visit('/#/watchlists')
		cy.contains('Rick and Morty').should('be.visible')
		cy.contains('button', 'Add to my media').click()
		cy.wait('@addMedia')
	})

	it('shows nested watchlists inline and requests access', () => {
		cy.intercept('POST', '/api/watchlists/2/access-requests', { statusCode: 204 }).as('requestAccess')
		cy.visit('/#/watchlists')
		cy.contains('Lord of the Rings').click()
		cy.contains('The Fellowship of the Ring').should('be.visible')
		cy.contains('button', 'Request access').click()
		cy.wait('@requestAccess')
	})

	it('updates editable member permissions offline', () => {
		cy.intercept('PUT', '/api/watchlists/1/members/4', { statusCode: 204 }).as('updateMember')
		cy.visit('/#/watchlists')
		cy.get('button[aria-label="Edit watchlist"]').click()
		cy.contains('.watchlist-member', 'PartnerUser').within(() => {
			cy.get('button[aria-label="Edit"]').click()
			cy.contains('label', 'Remove items').find('input').check()
			cy.contains('button', 'Save').click()
		})
		cy.wait('@updateMember')
	})

	it('creates a new watchlist offline', () => {
		cy.intercept('POST', '/api/watchlists?*', {
			body: { ...watchlistDetail, id: 9, name: 'New list' },
		}).as('createWatchlist')
		cy.visit('/#/watchlists')
		cy.contains('button', '+ Create watchlist').click()
		cy.get('.watchlist-create').within(() => {
			cy.get('input[placeholder="Name"]').type('New list')
			cy.contains('button', 'Create').click()
		})
		cy.wait('@createWatchlist')
	})
})
