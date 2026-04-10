describe('Person Journey', () => {
	beforeEach(() => {
		cy.login()
		cy.intercept('GET', '/api/profile/*', { fixture: 'profile-detail.json' })
		cy.intercept('GET', '/api/profile/*/activity', { fixture: 'activity.json' })
		cy.intercept('GET', '/api/stats/*/upcoming', { body: [] })
		cy.intercept('GET', '/api/media/person/*/credits', {
			body: {
				tmdbPersonId: 17419,
				name: 'Bryan Cranston',
				profilePath: '/person-photo.jpg',
				credits: [
					{
						tmdbId: 1396,
						title: 'Breaking Bad',
						mediaType: 'Series',
						character: 'Walter White',
						voteAverage: 8.9,
						releaseYear: 2008,
						posterPath: '/poster1.jpg',
						localMediaItemId: 1,
						isInYourLibrary: true,
					},
					{
						tmdbId: 27205,
						title: 'Inception',
						mediaType: 'Movie',
						character: 'Minor Role',
						voteAverage: 8.4,
						releaseYear: 2010,
						posterPath: '/poster2.jpg',
						localMediaItemId: 2,
						isInYourLibrary: false,
					},
					{
						tmdbId: 99999,
						title: 'Unknown Film',
						mediaType: 'Movie',
						character: 'Extra',
						voteAverage: 5.0,
						releaseYear: 2020,
						posterPath: null,
						localMediaItemId: null,
						isInYourLibrary: false,
					},
				],
			},
		}).as('personCredits')
	})

	it('displays person name and photo', () => {
		cy.visit('/#/person/17419')
		cy.wait('@personCredits')
		cy.get('.person__name').should('contain.text', 'Bryan Cranston')
		cy.get('.person__photo').should('be.visible')
	})

	it('shows "In Your Library" credits section', () => {
		cy.visit('/#/person/17419')
		cy.wait('@personCredits')
		cy.get('.person__section').should('have.length.at.least', 1)
		cy.contains('Breaking Bad').should('be.visible')
		cy.contains('Walter White').should('be.visible')
	})

	it('shows other credits with fallback poster', () => {
		cy.visit('/#/person/17419')
		cy.wait('@personCredits')
		cy.contains('Unknown Film').should('be.visible')
	})

	it('navigates to media detail when clicking a library credit', () => {
		cy.intercept('GET', '/api/media/series/1', { fixture: 'series-list.json' })
		cy.intercept('GET', '/api/media/series/1/credits', { body: [] })
		cy.visit('/#/person/17419')
		cy.wait('@personCredits')
		cy.get('.person__credit-poster-link').first().click()
		cy.url().should('include', '/#/series/')
	})

	it('shows add button for non-library credits', () => {
		cy.visit('/#/person/17419')
		cy.wait('@personCredits')
		cy.get('.person__credit-add').should('have.length.at.least', 1)
	})

	it('opens add confirmation modal', () => {
		cy.intercept('POST', '/api/media/search/add', { statusCode: 200, body: { id: 99 } })
		cy.visit('/#/person/17419')
		cy.wait('@personCredits')
		cy.get('.person__credit-add').first().click()
		cy.get('.person__add-overlay').should('be.visible')
		cy.get('.person__add-modal').should('be.visible')
	})
})
