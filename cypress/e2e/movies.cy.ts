describe('Movies Journey', () => {
	beforeEach(() => {
		cy.login()
		cy.intercept('GET', '/api/media/movies?*', { fixture: 'movies-list.json' }).as('moviesList')
		cy.intercept('GET', '/api/profile/*', { fixture: 'profile-detail.json' })
		cy.intercept('GET', '/api/profile/*/activity', { fixture: 'activity.json' })
		cy.intercept('GET', '/api/stats/*/upcoming', { body: [] })
	})

	it('displays movies list with data', () => {
		cy.visit('/#/movies')
		cy.wait('@moviesList')
		cy.contains('Inception').should('be.visible')
		cy.contains('The Matrix').should('be.visible')
	})

	it('shows movie posters', () => {
		cy.visit('/#/movies')
		cy.wait('@moviesList')
		cy.get('.media-poster').should('have.length.at.least', 2)
	})

	it('navigates to movie detail', () => {
		cy.intercept('GET', '/api/media/movies/10?*', {
			body: {
				id: 10,
				title: 'Inception',
				overview: 'A mind-bending thriller.',
				genres: 'Sci-Fi,Thriller',
				releaseDate: '2010-07-16',
				runtime: 148,
				state: 2,
				userRating: 4.5,
				mediaItemId: 200,
				ratings: [{ provider: 0, score: 8.4 }],
			},
		}).as('movieDetail')
		cy.intercept('GET', '/api/media/movies/10/credits', { body: [] })

		cy.visit('/#/movies')
		cy.wait('@moviesList')
		cy.contains('Inception').click()
		cy.wait('@movieDetail')
		cy.get('h1').should('contain', 'Inception')
	})

	it('shows watch state badges on movie cards', () => {
		cy.visit('/#/movies')
		cy.wait('@moviesList')
		cy.get('.watch-state-badge').should('have.length.at.least', 1)
	})

	it('shows empty state when no movies', () => {
		cy.intercept('GET', '/api/media/movies?*', {
			body: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
		}).as('emptyMovies')
		cy.visit('/#/movies')
		cy.wait('@emptyMovies')
		cy.get('.empty-state').should('be.visible')
	})

	it('filters movies by search', () => {
		cy.intercept('GET', '/api/media/movies?*search=matrix*', {
			body: {
				items: [
					{
						id: 11,
						title: 'The Matrix',
						genres: 'Sci-Fi',
						state: 0,
						mediaItemId: 201,
						ratings: [],
					},
				],
				page: 1,
				pageSize: 20,
				totalCount: 1,
				totalPages: 1,
			},
		}).as('filteredMovies')

		cy.visit('/#/movies')
		cy.wait('@moviesList')
		cy.get('input[type="text"], input[type="search"]').first().type('matrix')
		cy.wait('@filteredMovies')
		cy.contains('The Matrix').should('be.visible')
	})
})
