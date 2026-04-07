import type { SyncJobStatus, SyncJobType } from './Enums'

export interface SyncJobDto {
	id: number
	type: SyncJobType
	status: SyncJobStatus
	profileId: number | null
	profileName: string | null
	startedAt: string
	completedAt: string | null
	itemsProcessed: number
	errorMessage: string | null
}

export interface ProviderSettingsDto {
	tmdbEnabled: boolean
	tmdbHasApiKey: boolean
	omdbEnabled: boolean
	omdbHasApiKey: boolean
	tvMazeEnabled: boolean
	primaryLanguage: string
	fallbackLanguage: string | null
}

export interface WebhookEventLogDto {
	id: number
	eventType: string | null
	receivedAt: string
	processedAt: string | null
	success: boolean
	errorMessage: string | null
}

export interface ImportQueueItemDto {
	id: number
	jellyfinItemId: string
	mediaType: string
	priority: number
	status: string
	retryCount: number
	createdAt: string
}

export interface MediaLibraryItemDto {
	id: number
	title: string
	mediaType: string
	posterPath: string | null
	releaseDate: string | null
	status: string | null
	tmdbId: number | null
	tvMazeId: number | null
	imdbId: string | null
	createdAt: string
}

export interface BlacklistedItemDto {
	id: number
	jellyfinItemId: string
	displayName: string | null
	reason: string | null
	createdAt: string
}

export interface AddToBlacklistDto {
	jellyfinItemId: string
	displayName?: string
	reason?: string
}
