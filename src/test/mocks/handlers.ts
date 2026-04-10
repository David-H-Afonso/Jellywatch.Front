import { http, HttpResponse } from 'msw'
import {
	createLoginResponse,
	createUserMeResponse,
	createPagedResult,
	createSeriesListDto,
	createSeriesDetailDto,
	createMovieListDto,
	createMovieDetailDto,
	createProfile,
	createProfileDetailDto,
	createActivityDto,
	createPropagationRuleDto,
	createProviderSettingsDto,
	createSyncJobDto,
	createWebhookLogDto,
	createImportQueueItemDto,
	createMediaLibraryItemDto,
	createBlacklistedItemDto,
	createUserDto,
	createCalendarDayDto,
	createWrappedDto,
	createUpcomingEpisodeDto,
	createCastMemberDto,
	createPersonCreditsDto,
	createNoteDto,
} from '../factories'

const API = 'http://localhost:5011'

export const handlers = [
	// ── Auth ──────────────────────────────────────────────────────
	http.post(`${API}/api/auth/login`, () => HttpResponse.json(createLoginResponse())),
	http.get(`${API}/api/auth/logout`, () => new HttpResponse(null, { status: 204 })),
	http.get(`${API}/api/auth/me`, () => HttpResponse.json(createUserMeResponse())),

	// ── Profiles ─────────────────────────────────────────────────
	http.get(`${API}/api/profile`, () => HttpResponse.json([createProfile()])),
	http.get(`${API}/api/profile/:id`, () => HttpResponse.json(createProfileDetailDto())),
	http.delete(`${API}/api/profile/:id`, () => new HttpResponse(null, { status: 204 })),
	http.get(`${API}/api/profile/:profileId/activity`, () =>
		HttpResponse.json(createPagedResult([createActivityDto()]))
	),
	http.patch(
		`${API}/api/profile/:profileId/episodes/:episodeId/state`,
		() => new HttpResponse(null, { status: 204 })
	),
	http.patch(
		`${API}/api/profile/:profileId/movies/:movieId/state`,
		() => new HttpResponse(null, { status: 204 })
	),
	http.patch(
		`${API}/api/profile/:profileId/seasons/:seasonId/state`,
		() => new HttpResponse(null, { status: 204 })
	),
	http.patch(
		`${API}/api/profile/:profileId/series/:seriesId/state`,
		() => new HttpResponse(null, { status: 204 })
	),
	http.delete(
		`${API}/api/profile/:profileId/media/:mediaItemId`,
		() => new HttpResponse(null, { status: 204 })
	),
	http.put(
		`${API}/api/profile/:profileId/media/:mediaItemId/block`,
		() => new HttpResponse(null, { status: 204 })
	),
	http.delete(
		`${API}/api/profile/:profileId/media/:mediaItemId/block`,
		() => new HttpResponse(null, { status: 204 })
	),
	http.get(`${API}/api/profile/:profileId/blocks`, () => HttpResponse.json([])),

	// ── Series ───────────────────────────────────────────────────
	http.get(`${API}/api/media/series`, () =>
		HttpResponse.json(createPagedResult([createSeriesListDto()]))
	),
	http.get(`${API}/api/media/series/:id`, () => HttpResponse.json(createSeriesDetailDto())),
	http.get(`${API}/api/media/series/:id/seasons`, () => HttpResponse.json([])),
	http.get(`${API}/api/media/series/:id/credits`, () => HttpResponse.json([createCastMemberDto()])),
	http.get(`${API}/api/media/series/seasons/:seasonId/episodes`, () => HttpResponse.json([])),
	http.post(`${API}/api/media/series/:id/rating`, () => new HttpResponse(null, { status: 204 })),
	http.post(
		`${API}/api/media/series/:seriesId/episodes/:episodeId/rating`,
		() => new HttpResponse(null, { status: 204 })
	),
	http.post(
		`${API}/api/media/series/:seriesId/seasons/:seasonId/rating`,
		() => new HttpResponse(null, { status: 204 })
	),

	// ── Movies ───────────────────────────────────────────────────
	http.get(`${API}/api/media/movies`, () =>
		HttpResponse.json(createPagedResult([createMovieListDto()]))
	),
	http.get(`${API}/api/media/movies/:id`, () => HttpResponse.json(createMovieDetailDto())),
	http.post(`${API}/api/media/movies/:id/rating`, () => new HttpResponse(null, { status: 204 })),
	http.get(`${API}/api/media/movies/:id/credits`, () => HttpResponse.json([createCastMemberDto()])),

	// ── Person ───────────────────────────────────────────────────
	http.get(`${API}/api/media/person/:tmdbPersonId/credits`, () =>
		HttpResponse.json(createPersonCreditsDto())
	),

	// ── Notes ────────────────────────────────────────────────────
	http.get(`${API}/api/profiles/:profileId/notes`, () => HttpResponse.json([createNoteDto()])),
	http.post(`${API}/api/profiles/:profileId/notes`, () => HttpResponse.json(createNoteDto())),
	http.get(`${API}/api/profiles/:profileId/notes/:noteId`, () =>
		HttpResponse.json(createNoteDto())
	),
	http.put(`${API}/api/profiles/:profileId/notes/:noteId`, () =>
		HttpResponse.json(createNoteDto())
	),
	http.delete(
		`${API}/api/profiles/:profileId/notes/:noteId`,
		() => new HttpResponse(null, { status: 204 })
	),

	// ── Settings ─────────────────────────────────────────────────
	http.get(`${API}/api/settings/providers`, () => HttpResponse.json(createProviderSettingsDto())),
	http.get(`${API}/api/settings/propagation`, () =>
		HttpResponse.json([createPropagationRuleDto()])
	),
	http.post(`${API}/api/settings/propagation`, () => HttpResponse.json(createPropagationRuleDto())),
	http.put(`${API}/api/settings/propagation/:id`, () => new HttpResponse(null, { status: 204 })),
	http.delete(`${API}/api/settings/propagation/:id`, () => new HttpResponse(null, { status: 204 })),

	// ── Sync ─────────────────────────────────────────────────────
	http.post(`${API}/api/sync/trigger`, () => new HttpResponse(null, { status: 204 })),
	http.post(`${API}/api/sync/trigger-mine`, () => new HttpResponse(null, { status: 204 })),
	http.post(`${API}/api/sync/trigger/:profileId`, () => new HttpResponse(null, { status: 204 })),
	http.post(`${API}/api/sync/reconcile/:profileId`, () => new HttpResponse(null, { status: 204 })),
	http.post(`${API}/api/sync/re-propagate`, () => new HttpResponse(null, { status: 204 })),
	http.get(`${API}/api/sync/jobs`, () =>
		HttpResponse.json(createPagedResult([createSyncJobDto()]))
	),
	http.get(`${API}/api/sync/webhook-logs`, () =>
		HttpResponse.json(createPagedResult([createWebhookLogDto()]))
	),

	// ── Admin ────────────────────────────────────────────────────
	http.get(`${API}/api/admin/users`, () => HttpResponse.json([createUserDto()])),
	http.get(`${API}/api/admin/profiles`, () => HttpResponse.json([createProfile()])),
	http.get(`${API}/api/admin/jellyfin-users`, () => HttpResponse.json([])),
	http.post(`${API}/api/admin/add-profile`, () => HttpResponse.json(createProfile())),
	http.get(`${API}/api/admin/import-queue`, () =>
		HttpResponse.json(createPagedResult([createImportQueueItemDto()]))
	),
	http.get(`${API}/api/admin/media`, () =>
		HttpResponse.json(createPagedResult([createMediaLibraryItemDto()]))
	),
	http.get(`${API}/api/admin/media/:id`, () => HttpResponse.json(createMediaLibraryItemDto())),
	http.put(`${API}/api/admin/media/:id`, () => new HttpResponse(null, { status: 204 })),
	http.post(`${API}/api/admin/media/:id/refresh`, () => new HttpResponse(null, { status: 204 })),
	http.get(`${API}/api/admin/media/:id/poster-options`, () => HttpResponse.json([])),
	http.post(
		`${API}/api/admin/media/:id/select-poster`,
		() => new HttpResponse(null, { status: 204 })
	),
	http.get(`${API}/api/admin/media/:id/logo-options`, () => HttpResponse.json([])),
	http.post(
		`${API}/api/admin/media/:id/select-logo`,
		() => new HttpResponse(null, { status: 204 })
	),
	http.post(`${API}/api/admin/media/refresh-all-metadata`, () => HttpResponse.json({ count: 10 })),
	http.post(`${API}/api/admin/media/refresh-all-images`, () => HttpResponse.json({ count: 10 })),
	http.get(`${API}/api/admin/blacklist`, () => HttpResponse.json([createBlacklistedItemDto()])),
	http.post(`${API}/api/admin/blacklist`, () => HttpResponse.json(createBlacklistedItemDto())),
	http.delete(`${API}/api/admin/blacklist/:id`, () => new HttpResponse(null, { status: 204 })),
	http.get(`${API}/api/admin/profile-blocks`, () => HttpResponse.json([])),
	http.delete(`${API}/api/admin/profiles/:profileId/media`, () =>
		HttpResponse.json({
			message: 'Purged',
			watchStatesRemoved: 5,
			watchEventsRemoved: 10,
			blocksRemoved: 0,
		})
	),

	// ── Assets ───────────────────────────────────────────────────
	http.get(
		`${API}/api/asset/:mediaItemId/:imageType`,
		() => new HttpResponse(new Blob(), { headers: { 'Content-Type': 'image/jpeg' } })
	),
	http.post(`${API}/api/asset/refresh/:mediaItemId`, () => new HttpResponse(null, { status: 204 })),
	http.get(
		`${API}/api/asset/custom/:mediaItemId/poster`,
		() => new HttpResponse(null, { status: 204 })
	),
	http.post(
		`${API}/api/asset/custom/:mediaItemId/poster`,
		() => new HttpResponse(null, { status: 204 })
	),

	// ── Stats ────────────────────────────────────────────────────
	http.get(`${API}/api/stats/:profileId/wrapped`, () => HttpResponse.json(createWrappedDto())),
	http.get(`${API}/api/stats/:profileId/calendar`, () =>
		HttpResponse.json([createCalendarDayDto()])
	),
	http.get(`${API}/api/stats/:profileId/upcoming`, () =>
		HttpResponse.json([createUpcomingEpisodeDto()])
	),

	// ── Data Import/Export ────────────────────────────────────────
	http.get(
		`${API}/api/data/:profileId/export`,
		() =>
			new HttpResponse(new Blob(['csv-data']), {
				headers: { 'Content-Type': 'text/csv' },
			})
	),
	http.post(`${API}/api/data/:profileId/import/preview`, () =>
		HttpResponse.json({
			totalRows: 10,
			validRows: 8,
			duplicateRows: 1,
			notFoundRows: 1,
			errors: [],
			rows: [],
		})
	),
	http.post(`${API}/api/data/:profileId/import`, () =>
		HttpResponse.json({ imported: 8, skipped: 2, errors: [] })
	),
]
