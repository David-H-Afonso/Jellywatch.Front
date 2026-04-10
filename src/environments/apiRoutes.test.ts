import { describe, it, expect } from 'vitest'
import { apiRoutes } from '@/environments/apiRoutes'

// ──────────────────────────────────────────────
// Static routes
// ──────────────────────────────────────────────
describe('apiRoutes – static paths', () => {
	it('auth routes', () => {
		expect(apiRoutes.auth.login).toBe('/api/auth/login')
		expect(apiRoutes.auth.logout).toBe('/api/auth/logout')
		expect(apiRoutes.auth.me).toBe('/api/auth/me')
	})

	it('profile base', () => {
		expect(apiRoutes.profile.base).toBe('/api/profile')
	})

	it('series base', () => {
		expect(apiRoutes.series.base).toBe('/api/media/series')
	})

	it('movies base', () => {
		expect(apiRoutes.movies.base).toBe('/api/media/movies')
	})

	it('settings routes', () => {
		expect(apiRoutes.settings.providers).toBe('/api/settings/providers')
		expect(apiRoutes.settings.propagation).toBe('/api/settings/propagation')
	})

	it('sync routes', () => {
		expect(apiRoutes.sync.trigger).toBe('/api/sync/trigger')
		expect(apiRoutes.sync.triggerMine).toBe('/api/sync/trigger-mine')
		expect(apiRoutes.sync.jobs).toBe('/api/sync/jobs')
		expect(apiRoutes.sync.webhookLogs).toBe('/api/sync/webhook-logs')
		expect(apiRoutes.sync.rePropagate).toBe('/api/sync/re-propagate')
	})

	it('admin routes', () => {
		expect(apiRoutes.admin.users).toBe('/api/admin/users')
		expect(apiRoutes.admin.allProfiles).toBe('/api/admin/profiles')
		expect(apiRoutes.admin.jellyfinUsers).toBe('/api/admin/jellyfin-users')
		expect(apiRoutes.admin.addProfile).toBe('/api/admin/add-profile')
		expect(apiRoutes.admin.importQueue).toBe('/api/admin/import-queue')
		expect(apiRoutes.admin.media).toBe('/api/admin/media')
		expect(apiRoutes.admin.refreshAllMetadata).toBe('/api/admin/media/refresh-all-metadata')
		expect(apiRoutes.admin.refreshAllImages).toBe('/api/admin/media/refresh-all-images')
		expect(apiRoutes.admin.blacklist).toBe('/api/admin/blacklist')
		expect(apiRoutes.admin.profileBlocks).toBe('/api/admin/profile-blocks')
	})

	it('mediaSearch routes', () => {
		expect(apiRoutes.mediaSearch.tmdb).toBe('/api/media/search/tmdb')
		expect(apiRoutes.mediaSearch.add).toBe('/api/media/search/add')
	})
})

// ──────────────────────────────────────────────
// Dynamic route builders – profile
// ──────────────────────────────────────────────
describe('apiRoutes – profile dynamic', () => {
	it('byId', () => {
		expect(apiRoutes.profile.byId(5)).toBe('/api/profile/5')
	})

	it('activity', () => {
		expect(apiRoutes.profile.activity(3)).toBe('/api/profile/3/activity')
	})

	it('episodeState', () => {
		expect(apiRoutes.profile.episodeState(1, 42)).toBe('/api/profile/1/episodes/42/state')
	})

	it('movieState', () => {
		expect(apiRoutes.profile.movieState(1, 7)).toBe('/api/profile/1/movies/7/state')
	})

	it('seasonState', () => {
		expect(apiRoutes.profile.seasonState(2, 10)).toBe('/api/profile/2/seasons/10/state')
	})

	it('seriesState', () => {
		expect(apiRoutes.profile.seriesState(2, 99)).toBe('/api/profile/2/series/99/state')
	})

	it('removeMedia', () => {
		expect(apiRoutes.profile.removeMedia(1, 50)).toBe('/api/profile/1/media/50')
	})

	it('blockMedia', () => {
		expect(apiRoutes.profile.blockMedia(1, 50)).toBe('/api/profile/1/media/50/block')
	})

	it('unblockMedia', () => {
		expect(apiRoutes.profile.unblockMedia(1, 50)).toBe('/api/profile/1/media/50/block')
	})

	it('blocks', () => {
		expect(apiRoutes.profile.blocks(3)).toBe('/api/profile/3/blocks')
	})
})

// ──────────────────────────────────────────────
// Dynamic route builders – series
// ──────────────────────────────────────────────
describe('apiRoutes – series dynamic', () => {
	it('byId', () => {
		expect(apiRoutes.series.byId(100)).toBe('/api/media/series/100')
	})

	it('seasons', () => {
		expect(apiRoutes.series.seasons(100)).toBe('/api/media/series/100/seasons')
	})

	it('credits', () => {
		expect(apiRoutes.series.credits(100)).toBe('/api/media/series/100/credits')
	})

	it('episodes', () => {
		expect(apiRoutes.series.episodes(55)).toBe('/api/media/series/seasons/55/episodes')
	})

	it('rating', () => {
		expect(apiRoutes.series.rating(10)).toBe('/api/media/series/10/rating')
	})

	it('episodeRating', () => {
		expect(apiRoutes.series.episodeRating(10, 3)).toBe('/api/media/series/10/episodes/3/rating')
	})

	it('seasonRating', () => {
		expect(apiRoutes.series.seasonRating(10, 2)).toBe('/api/media/series/10/seasons/2/rating')
	})
})

// ──────────────────────────────────────────────
// Dynamic route builders – movies
// ──────────────────────────────────────────────
describe('apiRoutes – movies dynamic', () => {
	it('byId', () => {
		expect(apiRoutes.movies.byId(77)).toBe('/api/media/movies/77')
	})

	it('rating', () => {
		expect(apiRoutes.movies.rating(77)).toBe('/api/media/movies/77/rating')
	})

	it('credits', () => {
		expect(apiRoutes.movies.credits(77)).toBe('/api/media/movies/77/credits')
	})
})

// ──────────────────────────────────────────────
// Dynamic route builders – person
// ──────────────────────────────────────────────
describe('apiRoutes – person dynamic', () => {
	it('credits', () => {
		expect(apiRoutes.person.credits(12345)).toBe('/api/media/person/12345/credits')
	})
})

// ──────────────────────────────────────────────
// Dynamic route builders – notes
// ──────────────────────────────────────────────
describe('apiRoutes – notes dynamic', () => {
	it('base', () => {
		expect(apiRoutes.notes.base(3)).toBe('/api/profiles/3/notes')
	})

	it('byId', () => {
		expect(apiRoutes.notes.byId(3, 10)).toBe('/api/profiles/3/notes/10')
	})
})

// ──────────────────────────────────────────────
// Dynamic route builders – settings
// ──────────────────────────────────────────────
describe('apiRoutes – settings dynamic', () => {
	it('propagationById', () => {
		expect(apiRoutes.settings.propagationById(4)).toBe('/api/settings/propagation/4')
	})
})

// ──────────────────────────────────────────────
// Dynamic route builders – sync
// ──────────────────────────────────────────────
describe('apiRoutes – sync dynamic', () => {
	it('triggerProfile', () => {
		expect(apiRoutes.sync.triggerProfile(7)).toBe('/api/sync/trigger/7')
	})

	it('reconcile', () => {
		expect(apiRoutes.sync.reconcile(7)).toBe('/api/sync/reconcile/7')
	})
})

// ──────────────────────────────────────────────
// Dynamic route builders – admin
// ──────────────────────────────────────────────
describe('apiRoutes – admin dynamic', () => {
	it('mediaById', () => {
		expect(apiRoutes.admin.mediaById(5)).toBe('/api/admin/media/5')
	})

	it('mediaRefresh', () => {
		expect(apiRoutes.admin.mediaRefresh(5)).toBe('/api/admin/media/5/refresh')
	})

	it('mediaPosterOptions', () => {
		expect(apiRoutes.admin.mediaPosterOptions(5)).toBe('/api/admin/media/5/poster-options')
	})

	it('mediaSelectPoster', () => {
		expect(apiRoutes.admin.mediaSelectPoster(5)).toBe('/api/admin/media/5/select-poster')
	})

	it('mediaLogoOptions', () => {
		expect(apiRoutes.admin.mediaLogoOptions(5)).toBe('/api/admin/media/5/logo-options')
	})

	it('mediaSelectLogo', () => {
		expect(apiRoutes.admin.mediaSelectLogo(5)).toBe('/api/admin/media/5/select-logo')
	})

	it('blacklistById', () => {
		expect(apiRoutes.admin.blacklistById(9)).toBe('/api/admin/blacklist/9')
	})

	it('purgeProfileMedia', () => {
		expect(apiRoutes.admin.purgeProfileMedia(2)).toBe('/api/admin/profiles/2/media')
	})
})

// ──────────────────────────────────────────────
// Dynamic route builders – asset
// ──────────────────────────────────────────────
describe('apiRoutes – asset dynamic', () => {
	it('image', () => {
		expect(apiRoutes.asset.image(1, 'poster')).toBe('/api/asset/1/poster')
		expect(apiRoutes.asset.image(1, 'logo')).toBe('/api/asset/1/logo')
	})

	it('refresh', () => {
		expect(apiRoutes.asset.refresh(1)).toBe('/api/asset/refresh/1')
	})

	it('customPoster', () => {
		expect(apiRoutes.asset.customPoster(1)).toBe('/api/asset/custom/1/poster')
	})
})

// ──────────────────────────────────────────────
// Dynamic route builders – stats
// ──────────────────────────────────────────────
describe('apiRoutes – stats dynamic', () => {
	it('wrapped', () => {
		expect(apiRoutes.stats.wrapped(2)).toBe('/api/stats/2/wrapped')
	})

	it('calendar', () => {
		expect(apiRoutes.stats.calendar(2)).toBe('/api/stats/2/calendar')
	})

	it('upcoming', () => {
		expect(apiRoutes.stats.upcoming(2)).toBe('/api/stats/2/upcoming')
	})
})

// ──────────────────────────────────────────────
// Dynamic route builders – data
// ──────────────────────────────────────────────
describe('apiRoutes – data dynamic', () => {
	it('export', () => {
		expect(apiRoutes.data.export(2)).toBe('/api/data/2/export')
	})

	it('importPreview', () => {
		expect(apiRoutes.data.importPreview(2)).toBe('/api/data/2/import/preview')
	})

	it('import', () => {
		expect(apiRoutes.data.import(2)).toBe('/api/data/2/import')
	})
})
