import { vi, describe, it, expect, beforeEach } from 'vitest'

const { externalLinks } = vi.hoisted(() => ({
	externalLinks: {
		radarrUrl: '',
		radarrEnabled: false,
		sonarrUrl: '',
		sonarrEnabled: false,
	},
}))

vi.mock('@/environments', () => ({
	environment: { externalLinks },
}))

import { getExternalSearchLink, getExternalSearchLabel } from './externalLinks'
import { MediaType } from '@/models/api/Enums'

beforeEach(() => {
	externalLinks.radarrUrl = ''
	externalLinks.radarrEnabled = false
	externalLinks.sonarrUrl = ''
	externalLinks.sonarrEnabled = false
})

describe('getExternalSearchLink', () => {
	it('returns a Radarr add link for movies when enabled', () => {
		externalLinks.radarrEnabled = true
		externalLinks.radarrUrl = 'http://localhost:7878'
		expect(getExternalSearchLink(MediaType.Movie, 'The Matrix')).toBe(
			'http://localhost:7878/add/new?term=The%20Matrix'
		)
	})

	it('trims a trailing slash from the Radarr URL', () => {
		externalLinks.radarrEnabled = true
		externalLinks.radarrUrl = 'http://localhost:7878/'
		expect(getExternalSearchLink(MediaType.Movie, 'Dune')).toBe(
			'http://localhost:7878/add/new?term=Dune'
		)
	})

	it('returns null for movies when Radarr is disabled', () => {
		externalLinks.radarrEnabled = false
		externalLinks.radarrUrl = 'http://localhost:7878'
		expect(getExternalSearchLink(MediaType.Movie, 'The Matrix')).toBeNull()
	})

	it('returns null for movies when the Radarr URL is blank', () => {
		externalLinks.radarrEnabled = true
		externalLinks.radarrUrl = '   '
		expect(getExternalSearchLink(MediaType.Movie, 'The Matrix')).toBeNull()
	})

	it('returns a Sonarr add link for series when enabled', () => {
		externalLinks.sonarrEnabled = true
		externalLinks.sonarrUrl = 'http://localhost:8989'
		expect(getExternalSearchLink(MediaType.Series, 'Severance')).toBe(
			'http://localhost:8989/add/new?term=Severance'
		)
	})

	it('returns null for series when Sonarr is disabled', () => {
		externalLinks.sonarrEnabled = false
		externalLinks.sonarrUrl = 'http://localhost:8989'
		expect(getExternalSearchLink(MediaType.Series, 'Severance')).toBeNull()
	})

	it('does not build a Sonarr link from a movie media type', () => {
		externalLinks.sonarrEnabled = true
		externalLinks.sonarrUrl = 'http://localhost:8989'
		expect(getExternalSearchLink(MediaType.Movie, 'Severance')).toBeNull()
	})

	it('returns null for a blank title', () => {
		externalLinks.radarrEnabled = true
		externalLinks.radarrUrl = 'http://localhost:7878'
		expect(getExternalSearchLink(MediaType.Movie, '   ')).toBeNull()
	})
})

describe('getExternalSearchLabel', () => {
	it('maps movie to Radarr and series to Sonarr', () => {
		expect(getExternalSearchLabel(MediaType.Movie)).toBe('Radarr')
		expect(getExternalSearchLabel(MediaType.Series)).toBe('Sonarr')
	})
})
