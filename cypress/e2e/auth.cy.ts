describe('Auth Journey', () => {
	beforeEach(() => {
		cy.intercept('POST', '/api/auth/login', { fixture: 'login-response.json' }).as('login')
		cy.intercept('GET', '/api/auth/me', { fixture: 'user.json' }).as('me')
	})

	it('shows login form when not authenticated', () => {
		cy.visit('/#/login')
		cy.get('.login-card').should('be.visible')
		cy.get('label').contains('Server URL')
		cy.get('label').contains('Username')
		cy.get('label').contains('Password')
		cy.get('.login-btn').should('be.visible')
	})

	it('logs in successfully and redirects to dashboard', () => {
		cy.visit('/#/login')
		cy.get('#serverUrl').type('http://localhost:5011')
		cy.get('#username').type('TestUser')
		cy.get('#password').type('password123')
		cy.get('.login-btn').click()
		cy.wait('@login')
		cy.url().should('include', '/#/')
		cy.get('.login-card').should('not.exist')
	})

	it('shows error on failed login', () => {
		cy.intercept('POST', '/api/auth/login', {
			statusCode: 401,
			body: { message: 'Invalid credentials' },
		}).as('loginFail')
		cy.visit('/#/login')
		cy.get('#serverUrl').type('http://localhost:5011')
		cy.get('#username').type('wrong')
		cy.get('#password').type('wrong')
		cy.get('.login-btn').click()
		cy.wait('@loginFail')
		cy.get('.login-error').should('be.visible')
	})

	it('redirects to login when accessing protected route without auth', () => {
		cy.visit('/#/series')
		cy.url().should('include', '/login')
	})

	it('persists session across page reload', () => {
		cy.login()
		cy.intercept('GET', '/api/profile/*', { fixture: 'profile-detail.json' })
		cy.intercept('GET', '/api/profile/*/activity', { fixture: 'activity.json' })
		cy.intercept('GET', '/api/stats/*/upcoming', { body: [] })
		cy.visit('/#/')
		cy.get('.dashboard').should('be.visible')
		cy.reload()
		cy.get('.dashboard').should('be.visible')
	})

	it('logs out and redirects to login', () => {
		cy.login()
		cy.intercept('GET', '/api/profile/*', { fixture: 'profile-detail.json' })
		cy.intercept('GET', '/api/profile/*/activity', { fixture: 'activity.json' })
		cy.intercept('GET', '/api/stats/*/upcoming', { body: [] })
		cy.intercept('POST', '/api/auth/logout', { statusCode: 200 }).as('logout')
		cy.visit('/#/')
		cy.get('.header__logout, .header__user-menu').click()
		cy.contains('Logout').click({ force: true })
		cy.url().should('include', '/login')
	})
})
