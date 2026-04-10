describe('Calendar & Wrapped Journey', () => {
	beforeEach(() => {
		cy.login()
		cy.intercept('GET', '/api/profile/*', { fixture: 'profile-detail.json' })
		cy.intercept('GET', '/api/profile/*/activity', { fixture: 'activity.json' })
		cy.intercept('GET', '/api/stats/*/upcoming', { body: [] })
	})

	describe('Calendar', () => {
		const today = new Date()
		const yyyy = today.getFullYear()
		const mm = String(today.getMonth() + 1).padStart(2, '0')

		beforeEach(() => {
			cy.intercept('GET', '/api/stats/*/calendar*', {
				body: [
					{
						date: `${yyyy}-${mm}-05`,
						events: [
							{
								mediaItemId: 1,
								title: 'Breaking Bad',
								episodeName: 'Pilot',
								seasonNumber: 1,
								episodeNumber: 1,
								mediaType: 'series',
							},
						],
					},
					{
						date: `${yyyy}-${mm}-15`,
						events: [
							{
								mediaItemId: 10,
								title: 'Inception',
								episodeName: null,
								seasonNumber: null,
								episodeNumber: null,
								mediaType: 'movie',
							},
						],
					},
				],
			}).as('calendar')
		})

		it('displays calendar grid', () => {
			cy.visit('/#/calendar')
			cy.wait('@calendar')
			cy.get('.calendar-grid__header').should('have.length', 7)
		})

		it('shows cells with events', () => {
			cy.visit('/#/calendar')
			cy.wait('@calendar')
			cy.get('.calendar-grid__cell--has-events').should('have.length', 2)
		})

		it('has month navigation', () => {
			cy.visit('/#/calendar')
			cy.wait('@calendar')
			cy.contains('←').should('be.visible')
			cy.contains('→').should('be.visible')
		})

		it('clicking day shows event details', () => {
			cy.visit('/#/calendar')
			cy.wait('@calendar')
			cy.get('.calendar-grid__cell--has-events').first().click()
			cy.contains('Breaking Bad').should('be.visible')
		})

		it('has filter buttons', () => {
			cy.visit('/#/calendar')
			cy.wait('@calendar')
			cy.get('.calendar-filter').should('have.length', 3)
		})
	})

	describe('Wrapped', () => {
		beforeEach(() => {
			cy.intercept('GET', '/api/stats/*/wrapped*', {
				body: {
					totalEpisodesWatched: 500,
					totalMoviesWatched: 50,
					totalSeriesWatched: 20,
					totalWatchTimeMinutes: 30000,
					daysActive: 200,
					longestStreak: 15,
					busiestDay: { date: '2025-06-15', count: 12 },
					monthlyActivity: [
						{ month: 1, count: 45 },
						{ month: 6, count: 80 },
					],
					topSeries: [
						{
							id: 1,
							title: 'Breaking Bad',
							episodesWatched: 62,
							watchTimeMinutes: 3000,
							posterPath: '/poster1.jpg',
							mediaItemId: 100,
							userRating: 5.0,
						},
					],
					topMovies: [
						{
							id: 10,
							title: 'Inception',
							releaseYear: 2010,
							watchedAt: '2025-01-15',
							posterPath: '/movie1.jpg',
							mediaItemId: 200,
							userRating: 4.5,
						},
					],
					firstWatch: {
						id: 1,
						title: 'Breaking Bad',
						watchedAt: '2025-01-01',
						releaseYear: 2008,
						posterPath: '/poster1.jpg',
						mediaItemId: 100,
						userRating: 5.0,
					},
					genreBreakdown: [
						{ genre: 'Drama', count: 100 },
						{ genre: 'Sci-Fi', count: 30 },
					],
					topNetworks: [{ network: 'AMC', episodesWatched: 62 }],
					monthlyGenreInsights: [
						{ month: 1, genre: 'Drama', count: 15 },
						{ month: 6, genre: 'Sci-Fi', count: 10 },
					],
				},
			}).as('wrapped')
		})

		it('displays wrapped page', () => {
			cy.visit('/#/wrapped')
			cy.wait('@wrapped')
			cy.contains('Wrapped').should('be.visible')
		})

		it('shows hero stats', () => {
			cy.visit('/#/wrapped')
			cy.wait('@wrapped')
			cy.contains('500').should('be.visible')
			cy.contains('50').should('be.visible')
		})

		it('shows year selector', () => {
			cy.visit('/#/wrapped')
			cy.wait('@wrapped')
			cy.get('.wrapped__year-selector').should('be.visible')
			cy.contains('←').should('be.visible')
		})

		it('shows genre breakdown', () => {
			cy.visit('/#/wrapped')
			cy.wait('@wrapped')
			cy.get('.wrapped__donut').should('be.visible')
			cy.contains('Drama').should('be.visible')
		})
	})
})
