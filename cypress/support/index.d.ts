/// <reference types="cypress" />

declare namespace Cypress {
	interface Chainable {
		/**
		 * Seed localStorage with a fake JWT to bypass login.
		 * @param token - optional JWT string (default: 'fake-jwt-token')
		 */
		login(token?: string): Chainable<void>

		/**
		 * Seed localStorage with an admin user JWT to bypass login.
		 * @param token - optional JWT string (default: 'fake-jwt-token')
		 */
		loginAsAdmin(token?: string): Chainable<void>
	}
}
