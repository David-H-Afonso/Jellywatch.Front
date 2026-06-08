import { environment } from '@/environments'
import { MediaType } from '@/models/api/Enums'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const getExternalSearchLink = (mediaType: MediaType, title: string): string | null => {
	const { radarrEnabled, radarrUrl, sonarrEnabled, sonarrUrl } = environment.externalLinks
	const trimmedTitle = title.trim()
	if (!trimmedTitle) return null

	if (mediaType === MediaType.Movie && radarrEnabled && radarrUrl.trim()) {
		return `${trimTrailingSlash(radarrUrl)}/add/new?term=${encodeURIComponent(trimmedTitle)}`
	}

	if (mediaType === MediaType.Series && sonarrEnabled && sonarrUrl.trim()) {
		return `${trimTrailingSlash(sonarrUrl)}/add/new?term=${encodeURIComponent(trimmedTitle)}`
	}

	return null
}

export const getExternalSearchLabel = (mediaType: MediaType): string =>
	mediaType === MediaType.Movie ? 'Radarr' : 'Sonarr'
