describe('Data Manager Journey', () => {
	beforeEach(() => {
		cy.login()
		cy.intercept('GET', '/api/profile/*', { fixture: 'profile-detail.json' })
		cy.intercept('GET', '/api/profile/*/activity', { fixture: 'activity.json' })
		cy.intercept('GET', '/api/stats/*/upcoming', { body: [] })
		cy.intercept('GET', '/api/profile/*/blocks', {
			body: [],
		}).as('blocks')
	})

	it('displays the data manager page with sections', () => {
		cy.visit('/#/data')
		cy.get('.data-manager').should('be.visible')
		cy.get('.data-manager__section').should('have.length.at.least', 2)
	})

	it('shows export section with download button', () => {
		cy.visit('/#/data')
		cy.get('.data-manager__section').first().should('be.visible')
		cy.get('.data-manager__btn--primary').should('be.visible')
	})

	it('shows import section with file input', () => {
		cy.visit('/#/data')
		cy.get('.data-manager__file-input').should('exist')
	})

	it('triggers export download', () => {
		cy.intercept('GET', '/api/data/*/export', {
			statusCode: 200,
			headers: { 'content-type': 'text/csv' },
			body: 'title,season,episode\nBreaking Bad,1,1',
		}).as('export')
		cy.visit('/#/data')
		cy.contains(/export/i).click()
		cy.wait('@export')
	})

	it('previews CSV import', () => {
		cy.intercept('POST', '/api/data/*/import/preview', {
			body: {
				totalRows: 5,
				matchedRows: 3,
				unmatchedRows: 2,
				duplicateRows: 1,
				rows: [
					{ title: 'Breaking Bad', season: 1, episode: 1, status: 'will-add' },
					{ title: 'Unknown Show', season: 1, episode: 1, status: 'not-found' },
				],
			},
		}).as('preview')
		cy.visit('/#/data')
		cy.get('.data-manager__file-input').selectFile(
			{
				contents: Cypress.Buffer.from('title,season,episode\nBreaking Bad,1,1\nUnknown Show,1,1'),
				fileName: 'import.csv',
				mimeType: 'text/csv',
			},
			{ force: true }
		)
		cy.wait('@preview')
		cy.get('.data-manager__preview').should('be.visible')
	})

	it('confirms import after preview', () => {
		cy.intercept('POST', '/api/data/*/import/preview', {
			body: {
				totalRows: 1,
				matchedRows: 1,
				unmatchedRows: 0,
				duplicateRows: 0,
				rows: [{ title: 'Breaking Bad', season: 1, episode: 1, status: 'will-add' }],
			},
		}).as('preview')
		cy.intercept('POST', '/api/data/*/import', {
			body: { imported: 1, skipped: 0, errors: [] },
		}).as('import')
		cy.visit('/#/data')
		cy.get('.data-manager__file-input').selectFile(
			{
				contents: Cypress.Buffer.from('title,season,episode\nBreaking Bad,1,1'),
				fileName: 'import.csv',
				mimeType: 'text/csv',
			},
			{ force: true }
		)
		cy.wait('@preview')
		cy.get('.data-manager__import-actions .data-manager__btn--primary').click()
		cy.wait('@import')
		cy.get('.data-manager__result').should('be.visible')
	})

	it('shows blocked content section', () => {
		cy.visit('/#/data')
		cy.wait('@blocks')
		cy.get('.data-manager__section').last().should('be.visible')
	})

	it('shows empty state when no blocks exist', () => {
		cy.visit('/#/data')
		cy.wait('@blocks')
		cy.get('.data-manager__blacklist-empty').should('be.visible')
	})
})
