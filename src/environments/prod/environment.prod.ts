import { apiRoutes } from '../apiRoutes'

function getApiBaseUrl(): string {
	if (typeof globalThis !== 'undefined' && (globalThis as any).API_BASE_URL) {
		return (globalThis as any).API_BASE_URL
	}
	if (typeof globalThis !== 'undefined' && (globalThis as any).ENV?.VITE_API_URL) {
		return (globalThis as any).ENV.VITE_API_URL
	}
	if (import.meta.env.VITE_API_URL) {
		return import.meta.env.VITE_API_URL as string
	}
	// Fallback: empty string = same-origin, nginx proxy handles /api/ routes
	return ''
}

export const environment = {
	baseUrl: getApiBaseUrl(),
	apiRoutes,
}
