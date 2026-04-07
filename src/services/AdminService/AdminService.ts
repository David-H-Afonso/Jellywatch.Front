import { customFetch } from '@/utils/customFetch'
import { environment } from '@/environments'
import type {
	UserDto,
	ImportQueueItemDto,
	SyncJobDto,
	WebhookEventLogDto,
	MediaLibraryItemDto,
	BlacklistedItemDto,
	AddToBlacklistDto,
	PosterOptionDto,
	ProfileDto,
	PagedResult,
	JellyfinUserDto,
	AddProfileRequest,
} from '@/models/api'

const { apiRoutes } = environment

export const getUsers = async (): Promise<UserDto[]> => {
	return await customFetch<UserDto[]>(apiRoutes.admin.users)
}

export const getAllProfiles = async (): Promise<ProfileDto[]> => {
	return await customFetch<ProfileDto[]>(apiRoutes.admin.allProfiles)
}

export const getImportQueue = async (
	page = 1,
	pageSize = 10
): Promise<PagedResult<ImportQueueItemDto>> => {
	return await customFetch<PagedResult<ImportQueueItemDto>>(
		`${apiRoutes.admin.importQueue}?page=${page}&pageSize=${pageSize}`
	)
}

export const getSyncJobs = async (page = 1, pageSize = 10): Promise<PagedResult<SyncJobDto>> => {
	return await customFetch<PagedResult<SyncJobDto>>(
		`${apiRoutes.sync.jobs}?page=${page}&pageSize=${pageSize}`
	)
}

export const getWebhookLogs = async (
	page = 1,
	pageSize = 10
): Promise<PagedResult<WebhookEventLogDto>> => {
	return await customFetch<PagedResult<WebhookEventLogDto>>(
		`${apiRoutes.sync.webhookLogs}?page=${page}&pageSize=${pageSize}`
	)
}

export const triggerFullSync = async (): Promise<void> => {
	await customFetch<void>(apiRoutes.sync.trigger, { method: 'POST' })
}

export const triggerMineSync = async (): Promise<void> => {
	await customFetch<void>(apiRoutes.sync.triggerMine, { method: 'POST' })
}

export const rePropagate = async (): Promise<void> => {
	await customFetch<void>(apiRoutes.sync.rePropagate, { method: 'POST' })
}

export const triggerProfileSync = async (profileId: number): Promise<void> => {
	await customFetch<void>(apiRoutes.sync.triggerProfile(profileId), { method: 'POST' })
}

export const getMediaLibrary = async (
	page = 1,
	pageSize = 10
): Promise<PagedResult<MediaLibraryItemDto>> => {
	return await customFetch<PagedResult<MediaLibraryItemDto>>(
		`${apiRoutes.admin.media}?page=${page}&pageSize=${pageSize}`
	)
}

export const deleteMediaItem = async (id: number): Promise<void> => {
	await customFetch<void>(apiRoutes.admin.mediaById(id), { method: 'DELETE' })
}

export const getBlacklist = async (): Promise<BlacklistedItemDto[]> => {
	return await customFetch<BlacklistedItemDto[]>(apiRoutes.admin.blacklist)
}

export const addToBlacklist = async (dto: AddToBlacklistDto): Promise<BlacklistedItemDto> => {
	return await customFetch<BlacklistedItemDto>(apiRoutes.admin.blacklist, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(dto),
	})
}

export const removeFromBlacklist = async (id: number): Promise<void> => {
	await customFetch<void>(apiRoutes.admin.blacklistById(id), { method: 'DELETE' })
}

export const refreshMediaItem = async (
	id: number,
	forceTmdbId?: number,
	refreshImages?: boolean
): Promise<void> => {
	await customFetch<void>(apiRoutes.admin.mediaRefresh(id), {
		method: 'POST',
		body:
			forceTmdbId !== undefined || refreshImages !== undefined
				? { forceTmdbId, refreshImages: refreshImages ?? true }
				: {},
	})
}

export const getPosterOptions = async (id: number): Promise<PosterOptionDto[]> => {
	return await customFetch<PosterOptionDto[]>(apiRoutes.admin.mediaPosterOptions(id))
}

export const selectPoster = async (id: number, remoteUrl: string): Promise<void> => {
	await customFetch<void>(apiRoutes.admin.mediaSelectPoster(id), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ remoteUrl }),
	})
}

export const getLogoOptions = async (id: number): Promise<PosterOptionDto[]> => {
	return await customFetch<PosterOptionDto[]>(apiRoutes.admin.mediaLogoOptions(id))
}

export const selectLogo = async (id: number, remoteUrl: string): Promise<void> => {
	await customFetch<void>(apiRoutes.admin.mediaSelectLogo(id), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ remoteUrl }),
	})
}

export const refreshAllMetadata = async (): Promise<{ count: number }> => {
	return await customFetch<{ count: number }>(apiRoutes.admin.refreshAllMetadata, {
		method: 'POST',
	})
}

export const refreshAllImages = async (): Promise<{ count: number }> => {
	return await customFetch<{ count: number }>(apiRoutes.admin.refreshAllImages, {
		method: 'POST',
	})
}

export const getJellyfinUsers = async (): Promise<JellyfinUserDto[]> => {
	return await customFetch<JellyfinUserDto[]>(apiRoutes.admin.jellyfinUsers)
}

export const addProfileFromJellyfin = async (request: AddProfileRequest): Promise<ProfileDto> => {
	return await customFetch<ProfileDto>(apiRoutes.admin.addProfile, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(request),
	})
}
