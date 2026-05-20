import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, afterAll, beforeAll } from 'vitest'
import { server } from './mocks/server'

;(globalThis as any).API_BASE_URL = 'http://localhost:5011'

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

;(globalThis as any).ResizeObserver ??= ResizeObserverMock

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
	cleanup()
	server.resetHandlers()
})
afterAll(() => server.close())
