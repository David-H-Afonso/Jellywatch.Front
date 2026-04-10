describe('Activity Journey', () => {
	beforeEach(() => {
		cy.login()
		cy.intercept('GET', '/api/profile/*/activity*', { fixture: 'activity.json' }).as('activity')
		cy.intercept('GET', '/api/profile/*', { fixture: 'profile-detail.json' })
		cy.intercept('GET', '/api/stats/*/upcoming', { body: [] })
	})

	it('displays activity page with items', () => {
		cy.visit('/#/activity')
		cy.wait('@activity')
		cy.contains('Breaking Bad').should('be.visible')
		cy.contains('Inception').should('be.visible')
	})

	it('shows activity page heading', () => {
		cy.visit('/#/activity')
		cy.get('h1').should('be.visible')
	})

	it('has search and filter controls', () => {
		cy.visit('/#/activity')
		cy.wait('@activity')
		cy.get('input[type="text"], input[type="search"]').should('have.length.at.least', 1)
		cy.get('select').should('have.length.at.least', 1)
	})

	it('has date preset buttons', () => {
		cy.visit('/#/activity')
		cy.wait('@activity')
		cy.get('.activity-page__date-btn').should('have.length.at.least', 4)
	})

	it('shows empty state when no activity', () => {
		cy.intercept('GET', '/api/profile/*/activity*', {
			body: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
		}).as('emptyActivity')
		cy.visit('/#/activity')
		cy.wait('@emptyActivity')
		cy.get('.empty-state').should('be.visible')
	})
})
