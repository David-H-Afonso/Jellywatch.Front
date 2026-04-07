import type { RootState } from '@/store'

export const selectCurrentProfile = (state: RootState) => state.profile.currentProfile
export const selectProfileActivity = (state: RootState) => state.profile.activity
export const selectProfileActivityPagination = (state: RootState) =>
	state.profile.activityPagination
export const selectProfileLoading = (state: RootState) => state.profile.loading
export const selectProfileError = (state: RootState) => state.profile.error
