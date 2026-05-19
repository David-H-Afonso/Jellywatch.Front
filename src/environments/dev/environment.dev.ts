import { apiRoutes } from '../apiRoutes'

const getStringValue = (value: unknown): string | null =>
	typeof value === 'string' ? value : null

function getApiBaseUrl(): string {
	if (typeof globalThis !== 'undefined') {
		const runtimeApiBaseUrl = getStringValue((globalThis as any).API_BASE_URL)
		if (runtimeApiBaseUrl !== null) return runtimeApiBaseUrl

		const runtimeEnvApiUrl = getStringValue((globalThis as any).ENV?.VITE_API_URL)
		if (runtimeEnvApiUrl !== null) return runtimeEnvApiUrl
	}

	return (import.meta.env.VITE_API_URL as string | undefined) ?? ''
}

export const environment = {
	baseUrl: getApiBaseUrl(),
	apiRoutes,
}
