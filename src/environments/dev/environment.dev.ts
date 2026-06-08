import { apiRoutes } from '../apiRoutes'

const getStringValue = (value: unknown): string | null =>
	typeof value === 'string' ? value : null

const getBooleanValue = (value: unknown): boolean => {
	if (typeof value === 'boolean') return value
	if (typeof value !== 'string') return false
	return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

function getApiBaseUrl(): string {
	if (typeof globalThis !== 'undefined') {
		const runtimeApiBaseUrl = getStringValue((globalThis as any).API_BASE_URL)
		if (runtimeApiBaseUrl !== null) return runtimeApiBaseUrl

		const runtimeEnvApiUrl = getStringValue((globalThis as any).ENV?.VITE_API_URL)
		if (runtimeEnvApiUrl !== null) return runtimeEnvApiUrl
	}

	return (import.meta.env.VITE_API_URL as string | undefined) ?? ''
}

function getRuntimeString(name: string): string {
	if (typeof globalThis !== 'undefined') {
		const runtimeValue = getStringValue((globalThis as any)[name])
		if (runtimeValue !== null) return runtimeValue

		const runtimeEnvValue = getStringValue((globalThis as any).ENV?.[`VITE_${name}`])
		if (runtimeEnvValue !== null) return runtimeEnvValue
	}

	return (import.meta.env[`VITE_${name}`] as string | undefined) ?? ''
}

function getRuntimeBoolean(name: string): boolean {
	if (typeof globalThis !== 'undefined') {
		if (name in (globalThis as any)) return getBooleanValue((globalThis as any)[name])
		if ((globalThis as any).ENV?.[`VITE_${name}`] != null) {
			return getBooleanValue((globalThis as any).ENV[`VITE_${name}`])
		}
	}

	return getBooleanValue(import.meta.env[`VITE_${name}`])
}

export const environment = {
	baseUrl: getApiBaseUrl(),
	apiRoutes,
	externalLinks: {
		radarrUrl: getRuntimeString('RADARR_URL'),
		radarrEnabled: getRuntimeBoolean('RADARR_ENABLED'),
		sonarrUrl: getRuntimeString('SONARR_URL'),
		sonarrEnabled: getRuntimeBoolean('SONARR_ENABLED'),
	},
}
