import type { RootState } from '@/store'
import type { PaginationState } from '@/models/store/SeriesState'

const defaultPagination: PaginationState = { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }

export const selectCurrentProfile = (state: RootState) => state.profile.currentProfile
export const selectProfileActivity = (state: RootState) =>
	Array.isArray(state.profile.activity) ? state.profile.activity : []
export const selectProfileActivityPagination = (state: RootState) =>
	state.profile.activityPagination ?? defaultPagination
export const selectProfileLoading = (state: RootState) => state.profile.loading
export const selectProfileError = (state: RootState) => state.profile.error
