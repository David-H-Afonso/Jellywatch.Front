export const WatchState = {
	Unseen: 0,
	InProgress: 1,
	Seen: 2,
	WontWatch: 3,
} as const
export type WatchState = (typeof WatchState)[keyof typeof WatchState]

export const MediaType = {
	Series: 0,
	Movie: 1,
} as const
export type MediaType = (typeof MediaType)[keyof typeof MediaType]

export const ExternalProvider = {
	Tmdb: 0,
	Imdb: 1,
	RottenTomatoes: 2,
	TvMaze: 3,
	Omdb: 4,
} as const
export type ExternalProvider = (typeof ExternalProvider)[keyof typeof ExternalProvider]

export const WatchEventType = {
	Started: 0,
	Progress: 1,
	Stopped: 2,
	Finished: 3,
	Removed: 4,
} as const
export type WatchEventType = (typeof WatchEventType)[keyof typeof WatchEventType]

export const SyncSource = {
	Webhook: 0,
	Polling: 1,
	Manual: 2,
} as const
export type SyncSource = (typeof SyncSource)[keyof typeof SyncSource]

export const SyncJobType = {
	Full: 0,
	Profile: 1,
	Reconcile: 2,
} as const
export type SyncJobType = (typeof SyncJobType)[keyof typeof SyncJobType]

export const SyncJobStatus = {
	Pending: 0,
	Running: 1,
	Completed: 2,
	Failed: 3,
} as const
export type SyncJobStatus = (typeof SyncJobStatus)[keyof typeof SyncJobStatus]

export const ImportStatus = {
	Pending: 0,
	Processing: 1,
	Completed: 2,
	Failed: 3,
} as const
export type ImportStatus = (typeof ImportStatus)[keyof typeof ImportStatus]

export const WatchlistStatus = {
	WantToWatch: 0,
	Watching: 1,
	Paused: 2,
	Watched: 3,
	Dropped: 4,
} as const
export type WatchlistStatus = (typeof WatchlistStatus)[keyof typeof WatchlistStatus]

export const WatchlistState = {
	Pending: 0,
	Watching: 1,
	Completed: 2,
	Paused: 3,
	Archived: 4,
} as const
export type WatchlistState = (typeof WatchlistState)[keyof typeof WatchlistState]

export const WatchlistRole = {
	Owner: 0,
	Admin: 1,
	Member: 2,
} as const
export type WatchlistRole = (typeof WatchlistRole)[keyof typeof WatchlistRole]

export const WatchlistItemType = {
	MediaItem: 0,
	Watchlist: 1,
} as const
export type WatchlistItemType = (typeof WatchlistItemType)[keyof typeof WatchlistItemType]

export const WatchlistInvitationStatus = {
	Pending: 0,
	Accepted: 1,
	Rejected: 2,
} as const
export type WatchlistInvitationStatus =
	(typeof WatchlistInvitationStatus)[keyof typeof WatchlistInvitationStatus]

export const WatchlistAccessRequestStatus = {
	Pending: 0,
	Approved: 1,
	Rejected: 2,
} as const
export type WatchlistAccessRequestStatus =
	(typeof WatchlistAccessRequestStatus)[keyof typeof WatchlistAccessRequestStatus]
