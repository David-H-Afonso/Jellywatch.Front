import { apiRoutes } from '../apiRoutes'

function getApiBaseUrl(): string {
	if (typeof globalThis !== 'undefined' && (globalThis as any).API_BASE_URL) {
		return (globalThis as any).API_BASE_URL
	}
	if (typeof globalThis !== 'undefined' && (globalThis as any).ENV?.VITE_API_URL) {
		return (globalThis as any).ENV.VITE_API_URL
	}
	if (import.meta.env.DEV) {
		return 'http://localhost:5011'
	}
	return 'http://localhost:5011'
}

export const environment = {
	baseUrl: getApiBaseUrl(),
	apiRoutes,
}
