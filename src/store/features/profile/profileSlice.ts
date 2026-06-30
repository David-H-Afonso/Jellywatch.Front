import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { ProfileState } from '@/models/store/ProfileState'
import { fetchProfileDetail, fetchProfileActivity } from './thunk'

const initialState: ProfileState = {
	currentProfile: null,
	activity: [],
	activityPagination: {
		page: 1,
		pageSize: 20,
		totalCount: 0,
		totalPages: 0,
	},
	loading: false,
	error: null,
}

const profileSlice = createSlice({
	name: 'profile',
	initialState,
	reducers: {
		clearProfile: () => initialState,
		setActivityRating: (state, action: PayloadAction<{ id: number; rating: number | null }>) => {
			const entry = state.activity.find((item) => item.id === action.payload.id)
			if (entry) entry.userRating = action.payload.rating
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProfileDetail.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchProfileDetail.fulfilled, (state, action) => {
				state.loading = false
				state.currentProfile = action.payload
			})
			.addCase(fetchProfileDetail.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to fetch profile'
			})

		builder
			.addCase(fetchProfileActivity.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchProfileActivity.fulfilled, (state, action) => {
				state.loading = false
				state.activity = Array.isArray(action.payload?.data) ? action.payload.data : []
				state.activityPagination = {
					page: action.payload?.page ?? initialState.activityPagination.page,
					pageSize: action.payload?.pageSize ?? initialState.activityPagination.pageSize,
					totalCount: action.payload?.totalCount ?? initialState.activityPagination.totalCount,
					totalPages: action.payload?.totalPages ?? initialState.activityPagination.totalPages,
				}
			})
			.addCase(fetchProfileActivity.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to fetch activity'
			})
	},
})

export const { clearProfile, setActivityRating } = profileSlice.actions
export default profileSlice.reducer
