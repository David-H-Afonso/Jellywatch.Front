import { customFetch } from '@/utils/customFetch'
import { environment } from '@/environments'
import type {
	ProfileDto,
	ProfileDetailDto,
	ActivityDto,
	PagedResult,
	QueryParameters,
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
	params?: QueryParameters
): Promise<PagedResult<ActivityDto>> => {
	return await customFetch<PagedResult<ActivityDto>>(apiRoutes.profile.activity(profileId), {
		method: 'GET',
		params: params as Record<string, string | number | boolean>,
	})
}
