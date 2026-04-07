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
