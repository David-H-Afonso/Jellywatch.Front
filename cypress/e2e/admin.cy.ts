describe('Admin Journey', () => {
	beforeEach(() => {
		cy.loginAsAdmin()
		cy.intercept('GET', '/api/profile/*', { fixture: 'profile-detail.json' })
		cy.intercept('GET', '/api/profile/*/activity', { fixture: 'activity.json' })
		cy.intercept('GET', '/api/stats/*/upcoming', { body: [] })
		cy.intercept('GET', '/api/admin/users', {
			body: [
				{ id: 1, username: 'admin', isAdmin: true },
				{ id: 2, username: 'viewer', isAdmin: false },
			],
		}).as('users')
		cy.intercept('GET', '/api/admin/media?*', {
			body: {
				items: [
					{ id: 1, title: 'Breaking Bad', mediaType: 'Series', tmdbId: 1396 },
					{ id: 2, title: 'Inception', mediaType: 'Movie', tmdbId: 27205 },
				],
				page: 1,
				pageSize: 20,
				totalCount: 2,
				totalPages: 1,
			},
		}).as('media')
		cy.intercept('GET', '/api/admin/blacklist', {
			body: [
				{ id: 1, jellyfinItemId: 'jf-123', displayName: 'Blocked Show', reason: 'Not wanted' },
			],
		}).as('blacklist')
		cy.intercept('GET', '/api/admin/import-queue*', {
			body: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
		})
		cy.intercept('GET', '/api/sync/jobs*', {
			body: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
		})
		cy.intercept('GET', '/api/sync/webhook-logs*', {
			body: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
		})
		cy.intercept('GET', '/api/settings/providers', {
			body: { tmdbEnabled: true, omdbEnabled: true, tvmazeEnabled: true },
		})
		cy.intercept('GET', '/api/settings/propagation', { body: [] })
	})

	it('displays admin page heading', () => {
		cy.visit('/#/admin')
		cy.get('h1').should('be.visible')
	})

	it('shows collapsible sections', () => {
		cy.visit('/#/admin')
		cy.get('.admin-section__toggle').should('have.length.at.least', 5)
	})

	it('expands users section to show user table', () => {
		cy.visit('/#/admin')
		cy.get('.admin-section__toggle').contains(/user/i).click()
		cy.wait('@users')
		cy.contains('admin').should('be.visible')
		cy.contains('viewer').should('be.visible')
	})

	it('expands media library section', () => {
		cy.visit('/#/admin')
		cy.get('.admin-section__toggle')
			.contains(/media library/i)
			.click()
		cy.wait('@media')
		cy.contains('Breaking Bad').should('be.visible')
		cy.contains('Inception').should('be.visible')
	})

	it('expands blacklist section', () => {
		cy.visit('/#/admin')
		cy.get('.admin-section__toggle')
			.contains(/blacklist/i)
			.click()
		cy.wait('@blacklist')
		cy.contains('Blocked Show').should('be.visible')
	})

	it('has sync control buttons', () => {
		cy.visit('/#/admin')
		cy.get('.admin-section__toggle').contains(/sync/i).click()
		cy.get('.sync-controls').should('be.visible')
	})

	it('triggers full sync', () => {
		cy.intercept('POST', '/api/sync/trigger', { statusCode: 200 }).as('sync')
		cy.visit('/#/admin')
		cy.get('.admin-section__toggle').contains(/sync/i).click()
		cy.get('.sync-controls').should('be.visible')
		cy.contains(/full sync|sync all/i).click()
		cy.wait('@sync')
	})
})
