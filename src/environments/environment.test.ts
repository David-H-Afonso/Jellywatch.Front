import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('environment – dev', () => {
	beforeEach(() => {
		vi.unstubAllEnvs()
		delete (globalThis as any).API_BASE_URL
		delete (globalThis as any).ENV
	})

	it('exports baseUrl and apiRoutes', async () => {
		const mod = await import('@/environments/dev/environment.dev')
		expect(mod.environment).toHaveProperty('baseUrl')
		expect(mod.environment).toHaveProperty('apiRoutes')
		expect(typeof mod.environment.baseUrl).toBe('string')
		expect(mod.environment.baseUrl.length).toBeGreaterThan(0)
	})

	it('apiRoutes is the same object from apiRoutes module', async () => {
		const { apiRoutes } = await import('@/environments/apiRoutes')
		const mod = await import('@/environments/dev/environment.dev')
		expect(mod.environment.apiRoutes).toBe(apiRoutes)
	})
})

describe('environment – prod', () => {
	beforeEach(() => {
		vi.unstubAllEnvs()
		delete (globalThis as any).API_BASE_URL
		delete (globalThis as any).ENV
	})

	it('exports baseUrl and apiRoutes', async () => {
		const mod = await import('@/environments/prod/environment.prod')
		expect(mod.environment).toHaveProperty('baseUrl')
		expect(mod.environment).toHaveProperty('apiRoutes')
		expect(typeof mod.environment.baseUrl).toBe('string')
		expect(mod.environment.baseUrl.length).toBeGreaterThan(0)
	})

	it('apiRoutes is the same object from apiRoutes module', async () => {
		const { apiRoutes } = await import('@/environments/apiRoutes')
		const mod = await import('@/environments/prod/environment.prod')
		expect(mod.environment.apiRoutes).toBe(apiRoutes)
	})
})

describe('environment – index re-export', () => {
	it('exports an environment object with baseUrl and apiRoutes', async () => {
		const { environment } = await import('@/environments')
		expect(environment).toHaveProperty('baseUrl')
		expect(environment).toHaveProperty('apiRoutes')
	})
})
