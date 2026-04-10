describe('Series Journey', () => {
	beforeEach(() => {
		cy.login()
		cy.intercept('GET', '/api/media/series?*', { fixture: 'series-list.json' }).as('seriesList')
		cy.intercept('GET', '/api/profile/*', { fixture: 'profile-detail.json' })
		cy.intercept('GET', '/api/profile/*/activity', { fixture: 'activity.json' })
		cy.intercept('GET', '/api/stats/*/upcoming', { body: [] })
	})

	it('displays series list with data', () => {
		cy.visit('/#/series')
		cy.wait('@seriesList')
		cy.contains('Breaking Bad').should('be.visible')
		cy.contains('The Wire').should('be.visible')
		cy.contains('Better Call Saul').should('be.visible')
	})

	it('shows series posters', () => {
		cy.visit('/#/series')
		cy.wait('@seriesList')
		cy.get('.media-poster').should('have.length.at.least', 3)
	})

	it('shows watch state badges', () => {
		cy.visit('/#/series')
		cy.wait('@seriesList')
		cy.get('.watch-state-badge').should('have.length.at.least', 1)
	})

	it('navigates to series detail', () => {
		cy.intercept('GET', '/api/media/series/1?*', {
			body: {
				id: 1,
				title: 'Breaking Bad',
				overview: 'A chemistry teacher turned drug lord.',
				genres: 'Drama,Thriller',
				status: 'Ended',
				totalSeasons: 5,
				totalEpisodes: 62,
				state: 1,
				episodesSeen: 30,
				userRating: 5.0,
				mediaItemId: 100,
				seasons: [],
				ratings: [{ provider: 0, score: 9.5 }],
			},
		}).as('seriesDetail')
		cy.intercept('GET', '/api/media/series/1/credits', { body: [] })

		cy.visit('/#/series')
		cy.wait('@seriesList')
		cy.contains('Breaking Bad').click()
		cy.wait('@seriesDetail')
		cy.get('h1').should('contain', 'Breaking Bad')
	})

	it('filters series by search term', () => {
		cy.intercept('GET', '/api/media/series?*search=breaking*', {
			body: {
				items: [
					{
						id: 1,
						title: 'Breaking Bad',
						overview: 'A chemistry teacher turned drug lord.',
						posterPath: '/poster1.jpg',
						genres: 'Drama',
						state: 1,
						mediaItemId: 100,
						ratings: [],
					},
				],
				page: 1,
				pageSize: 20,
				totalCount: 1,
				totalPages: 1,
			},
		}).as('filteredSeries')

		cy.visit('/#/series')
		cy.wait('@seriesList')
		cy.get('input[type="text"], input[type="search"]').first().type('breaking')
		cy.wait('@filteredSeries')
		cy.contains('Breaking Bad').should('be.visible')
	})

	it('shows empty state when no series match', () => {
		cy.intercept('GET', '/api/media/series?*', {
			body: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
		}).as('emptySeries')
		cy.visit('/#/series')
		cy.wait('@emptySeries')
		cy.get('.empty-state').should('be.visible')
	})

	it('displays pagination controls', () => {
		cy.intercept('GET', '/api/media/series?*', {
			body: {
				items: [
					{
						id: 1,
						title: 'Breaking Bad',
						genres: 'Drama',
						state: 0,
						mediaItemId: 100,
						ratings: [],
					},
				],
				page: 1,
				pageSize: 20,
				totalCount: 40,
				totalPages: 2,
			},
		}).as('pagedSeries')
		cy.visit('/#/series')
		cy.wait('@pagedSeries')
		cy.get('.pagination').should('be.visible')
	})
})
