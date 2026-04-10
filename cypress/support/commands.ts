Cypress.Commands.add('login', (token = 'fake-jwt-token') => {
	const authState = {
		isAuthenticated: true,
		user: {
			id: 1,
			username: 'TestUser',
			isAdmin: false,
			avatarUrl: null,
			preferredLanguage: 'en',
			jellyfinUserId: 'jf-user-1',
			profiles: [{ id: 10, name: 'Main' }],
			activeProfileId: 10,
		},
		token,
		loading: false,
		error: null,
	}

	const persistRoot = JSON.stringify({
		auth: JSON.stringify(authState),
		_persist: JSON.stringify({ version: -1, rehydrated: true }),
	})

	localStorage.setItem('persist:root', persistRoot)
})

Cypress.Commands.add('loginAsAdmin', (token = 'fake-jwt-token') => {
	const authState = {
		isAuthenticated: true,
		user: {
			id: 1,
			username: 'Admin',
			isAdmin: true,
			avatarUrl: null,
			preferredLanguage: 'en',
			jellyfinUserId: 'jf-admin-1',
			profiles: [
				{ id: 10, name: 'Main' },
				{ id: 20, name: 'Secondary' },
			],
			activeProfileId: 10,
		},
		token,
		loading: false,
		error: null,
	}

	const persistRoot = JSON.stringify({
		auth: JSON.stringify(authState),
		_persist: JSON.stringify({ version: -1, rehydrated: true }),
	})

	localStorage.setItem('persist:root', persistRoot)
})
