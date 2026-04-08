import { customFetch } from '@/utils/customFetch'
import { environment } from '@/environments'
import type {
	ProfileDto,
	ProfileDetailDto,
	ActivityDto,
	PagedResult,
	ActivityQueryParameters,
	ProfileBlockedItemDto,
} from '@/models/api'

const { apiRoutes } = environment

export const getProfiles = async (): Promise<ProfileDto[]> => {
	return await customFetch<ProfileDto[]>(apiRoutes.profile.base)
}

export const getProfileDetail = async (id: number): Promise<ProfileDetailDto> => {
	return await customFetch<ProfileDetailDto>(apiRoutes.profile.byId(id))
}

export const getProfileActivity = async (
	profileId: number,
	params?: ActivityQueryParameters
): Promise<PagedResult<ActivityDto>> => {
	return await customFetch<PagedResult<ActivityDto>>(apiRoutes.profile.activity(profileId), {
		method: 'GET',
		params: params as Record<string, string | number | boolean>,
	})
}

export const removeMediaFromProfile = async (
	profileId: number,
	mediaItemId: number
): Promise<void> => {
	await customFetch<void>(apiRoutes.profile.removeMedia(profileId, mediaItemId), {
		method: 'DELETE',
	})
}

export const blockMediaForProfile = async (
	profileId: number,
	mediaItemId: number
): Promise<void> => {
	await customFetch<void>(apiRoutes.profile.blockMedia(profileId, mediaItemId), { method: 'POST' })
}

export const unblockMediaForProfile = async (
	profileId: number,
	mediaItemId: number
): Promise<void> => {
	await customFetch<void>(apiRoutes.profile.unblockMedia(profileId, mediaItemId), {
		method: 'DELETE',
	})
}

export const getProfileBlocks = async (profileId: number): Promise<ProfileBlockedItemDto[]> => {
	return await customFetch<ProfileBlockedItemDto[]>(apiRoutes.profile.blocks(profileId))
}
