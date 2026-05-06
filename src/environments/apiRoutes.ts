export const apiRoutes = {
	auth: {
		login: '/api/auth/login',
		logout: '/api/auth/logout',
		me: '/api/auth/me',
	},
	profile: {
		base: '/api/profile',
		byId: (id: number) => `/api/profile/${id}`,
		activity: (profileId: number) => `/api/profile/${profileId}/activity`,
		episodeState: (profileId: number, episodeId: number) =>
			`/api/profile/${profileId}/episodes/${episodeId}/state`,
		movieState: (profileId: number, movieId: number) =>
			`/api/profile/${profileId}/movies/${movieId}/state`,
		seasonState: (profileId: number, seasonId: number) =>
			`/api/profile/${profileId}/seasons/${seasonId}/state`,
		seriesState: (profileId: number, seriesId: number) =>
			`/api/profile/${profileId}/series/${seriesId}/state`,
		removeMedia: (profileId: number, mediaItemId: number) =>
			`/api/profile/${profileId}/media/${mediaItemId}`,
		blockMedia: (profileId: number, mediaItemId: number) =>
			`/api/profile/${profileId}/media/${mediaItemId}/block`,
		unblockMedia: (profileId: number, mediaItemId: number) =>
			`/api/profile/${profileId}/media/${mediaItemId}/block`,
		blocks: (profileId: number) => `/api/profile/${profileId}/blocks`,
	},
	series: {
		base: '/api/media/series',
		byId: (id: number) => `/api/media/series/${id}`,
		seasons: (id: number) => `/api/media/series/${id}/seasons`,
		credits: (id: number) => `/api/media/series/${id}/credits`,
		episodes: (seasonId: number) => `/api/media/series/seasons/${seasonId}/episodes`,
		rating: (id: number) => `/api/media/series/${id}/rating`,
		episodeRating: (seriesId: number, episodeId: number) =>
			`/api/media/series/${seriesId}/episodes/${episodeId}/rating`,
		seasonRating: (seriesId: number, seasonId: number) =>
			`/api/media/series/${seriesId}/seasons/${seasonId}/rating`,
	},
	movies: {
		base: '/api/media/movies',
		byId: (id: number) => `/api/media/movies/${id}`,
		rating: (id: number) => `/api/media/movies/${id}/rating`,
		credits: (id: number) => `/api/media/movies/${id}/credits`,
	},
	person: {
		credits: (tmdbPersonId: number) => `/api/media/person/${tmdbPersonId}/credits`,
	},
	notes: {
		base: (profileId: number) => `/api/profiles/${profileId}/notes`,
		byId: (profileId: number, noteId: number) => `/api/profiles/${profileId}/notes/${noteId}`,
	},
	settings: {
		providers: '/api/settings/providers',
		propagation: '/api/settings/propagation',
		propagationById: (id: number) => `/api/settings/propagation/${id}`,
	},
	sync: {
		trigger: '/api/sync/trigger',
		triggerMine: '/api/sync/trigger-mine',
		triggerProfile: (profileId: number) => `/api/sync/trigger/${profileId}`,
		reconcile: (profileId: number) => `/api/sync/reconcile/${profileId}`,
		rePropagate: '/api/sync/re-propagate',
		refreshWatchDates: (seriesId: number, profileId: number) =>
			`/api/sync/refresh-watch-dates/${seriesId}?profileId=${profileId}`,
		jobs: '/api/sync/jobs',
		webhookLogs: '/api/sync/webhook-logs',
	},
	admin: {
		users: '/api/admin/users',
		allProfiles: '/api/admin/profiles',
		jellyfinUsers: '/api/admin/jellyfin-users',
		addProfile: '/api/admin/add-profile',
		importQueue: '/api/admin/import-queue',
		media: '/api/admin/media',
		mediaById: (id: number) => `/api/admin/media/${id}`,
		mediaRefresh: (id: number) => `/api/admin/media/${id}/refresh`,
		mediaPosterOptions: (id: number) => `/api/admin/media/${id}/poster-options`,
		mediaSelectPoster: (id: number) => `/api/admin/media/${id}/select-poster`,
		mediaLogoOptions: (id: number) => `/api/admin/media/${id}/logo-options`,
		mediaSelectLogo: (id: number) => `/api/admin/media/${id}/select-logo`,
		refreshAllMetadata: '/api/admin/media/refresh-all-metadata',
		refreshAllImages: '/api/admin/media/refresh-all-images',
		blacklist: '/api/admin/blacklist',
		blacklistById: (id: number) => `/api/admin/blacklist/${id}`,
		profileBlocks: '/api/admin/profile-blocks',
		purgeProfileMedia: (profileId: number) => `/api/admin/profiles/${profileId}/media`,
		deleteProfile: (id: number) => `/api/admin/profiles/${id}`,
	},
	asset: {
		image: (mediaItemId: number, imageType: string) => `/api/asset/${mediaItemId}/${imageType}`,
		refresh: (mediaItemId: number) => `/api/asset/refresh/${mediaItemId}`,
		customPoster: (mediaItemId: number) => `/api/asset/custom/${mediaItemId}/poster`,
	},
	stats: {
		wrapped: (profileId: number) => `/api/stats/${profileId}/wrapped`,
		calendar: (profileId: number) => `/api/stats/${profileId}/calendar`,
		upcoming: (profileId: number) => `/api/stats/${profileId}/upcoming`,
	},
	data: {
		export: (profileId: number) => `/api/data/${profileId}/export`,
		importPreview: (profileId: number) => `/api/data/${profileId}/import/preview`,
		import: (profileId: number) => `/api/data/${profileId}/import`,
	},
	mediaSearch: {
		tmdb: '/api/media/search/tmdb',
		add: '/api/media/search/add',
	},
	backupSchedule: {
		base: '/api/backupschedule',
		runNow: '/api/backupschedule/run-now',
	},
} as const

export type ApiRoutes = typeof apiRoutes
