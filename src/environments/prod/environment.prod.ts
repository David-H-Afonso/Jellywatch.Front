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
	return 'http://192.168.0.32:1985'
}

export const environment = {
	baseUrl: getApiBaseUrl(),
	apiRoutes,
}
