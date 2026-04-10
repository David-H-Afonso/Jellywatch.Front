describe('Settings Journey', () => {
	beforeEach(() => {
		cy.loginAsAdmin()
		cy.intercept('GET', '/api/profile/*', { fixture: 'profile-detail.json' })
		cy.intercept('GET', '/api/profile/*/activity', { fixture: 'activity.json' })
		cy.intercept('GET', '/api/stats/*/upcoming', { body: [] })
		cy.intercept('GET', '/api/settings/providers', {
			body: {
				tmdbConfigured: true,
				omdbConfigured: true,
				tvmazeConfigured: true,
				primaryLanguage: 'en',
				fallbackLanguage: 'es',
			},
		}).as('providers')
		cy.intercept('GET', '/api/settings/propagation', {
			body: [{ id: 1, sourceProfileId: 1, targetProfileId: 2, isActive: true }],
		}).as('propagation')
		cy.intercept('GET', '/api/admin/profiles', {
			body: [
				{ id: 1, name: 'Admin' },
				{ id: 2, name: 'Viewer' },
			],
		})
	})

	it('displays the settings page', () => {
		cy.visit('/#/admin')
		cy.get('.admin-section__toggle')
			.contains(/settings/i)
			.click()
		cy.wait('@providers')
		cy.get('.provider-status').should('be.visible')
	})

	it('shows provider status badges', () => {
		cy.visit('/#/admin')
		cy.get('.admin-section__toggle')
			.contains(/settings/i)
			.click()
		cy.wait('@providers')
		cy.get('.provider-status__item').should('have.length.at.least', 2)
	})

	it('shows propagation rules table', () => {
		cy.visit('/#/admin')
		cy.get('.admin-section__toggle')
			.contains(/settings/i)
			.click()
		cy.wait('@propagation')
		cy.get('.rules-table').should('be.visible')
	})

	it('can add a propagation rule', () => {
		cy.intercept('POST', '/api/settings/propagation', {
			statusCode: 201,
			body: { id: 2, sourceProfileId: 2, targetProfileId: 1, isActive: true },
		}).as('createRule')
		cy.visit('/#/admin')
		cy.get('.admin-section__toggle')
			.contains(/settings/i)
			.click()
		cy.wait('@propagation')
		cy.get('.add-rule__form select').first().select('2')
		cy.get('.add-rule__form select').last().select('1')
		cy.get('.add-rule__form').find('.btn-primary').click()
		cy.wait('@createRule')
	})

	it('can toggle a propagation rule', () => {
		cy.intercept('PUT', '/api/settings/propagation/1', {
			body: { id: 1, sourceProfileId: 1, targetProfileId: 2, isActive: false },
		}).as('toggleRule')
		cy.visit('/#/admin')
		cy.get('.admin-section__toggle')
			.contains(/settings/i)
			.click()
		cy.wait('@propagation')
		cy.get('.toggle-btn').first().click()
		cy.wait('@toggleRule')
	})

	it('can delete a propagation rule', () => {
		cy.intercept('DELETE', '/api/settings/propagation/1', { statusCode: 204 }).as('deleteRule')
		cy.visit('/#/admin')
		cy.get('.admin-section__toggle')
			.contains(/settings/i)
			.click()
		cy.wait('@propagation')
		cy.get('.delete-btn').first().click()
		cy.wait('@deleteRule')
	})
})
