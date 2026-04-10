describe('Dashboard Journey', () => {
	beforeEach(() => {
		cy.login()
		cy.intercept('GET', '/api/profile/*', { fixture: 'profile-detail.json' }).as('profile')
		cy.intercept('GET', '/api/profile/*/activity', { fixture: 'activity.json' }).as('activity')
		cy.intercept('GET', '/api/stats/*/upcoming', { body: [] }).as('upcoming')
	})

	it('displays dashboard with welcome message', () => {
		cy.visit('/#/')
		cy.wait('@profile')
		cy.contains('TestUser').should('be.visible')
	})

	it('shows profile stats', () => {
		cy.visit('/#/')
		cy.wait('@profile')
		cy.get('.stat-card').should('have.length.at.least', 4)
		cy.contains('5').should('be.visible')
		cy.contains('20').should('be.visible')
		cy.contains('50').should('be.visible')
		cy.contains('1200').should('be.visible')
	})

	it('shows recent activity items', () => {
		cy.visit('/#/')
		cy.wait('@activity')
		cy.contains('Breaking Bad').should('be.visible')
		cy.contains('Inception').should('be.visible')
	})

	it('navigates to series from activity', () => {
		cy.intercept('GET', '/api/media/series/1?*', {
			body: {
				id: 1,
				title: 'Breaking Bad',
				overview: 'A chemistry teacher.',
				genres: 'Drama',
				state: 1,
				mediaItemId: 100,
				seasons: [],
				ratings: [],
			},
		}).as('seriesDetail')
		cy.intercept('GET', '/api/media/series/1/credits', { body: [] })

		cy.visit('/#/')
		cy.wait('@activity')
		cy.get('.activity-item__poster-link, .activity-item a').first().click()
		cy.url().should('include', '/series/1')
	})

	it('displays empty state when no activity', () => {
		cy.intercept('GET', '/api/profile/*/activity', {
			body: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
		}).as('emptyActivity')
		cy.visit('/#/')
		cy.wait('@emptyActivity')
		cy.get('.empty-state').should('be.visible')
	})
})
