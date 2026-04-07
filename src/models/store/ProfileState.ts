import type { ActivityDto, ProfileDetailDto } from '../api'
import type { PaginationState } from './SeriesState'

export interface ProfileState {
	currentProfile: ProfileDetailDto | null
	activity: ActivityDto[]
	activityPagination: PaginationState
	loading: boolean
	error: string | null
}
