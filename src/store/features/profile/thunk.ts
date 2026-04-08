import { createAsyncThunk } from '@reduxjs/toolkit'
import { getProfileDetail, getProfileActivity } from '@/services/ProfileService/ProfileService'
import type { ActivityQueryParameters } from '@/models/api'

export const fetchProfileDetail = createAsyncThunk(
	'profile/fetchProfileDetail',
	async (profileId: number, { rejectWithValue }) => {
		try {
			return await getProfileDetail(profileId)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to fetch profile'
			return rejectWithValue(message)
		}
	}
)

export const fetchProfileActivity = createAsyncThunk(
	'profile/fetchProfileActivity',
	async (
		{ profileId, params }: { profileId: number; params?: ActivityQueryParameters },
		{ rejectWithValue }
	) => {
		try {
			return await getProfileActivity(profileId, params)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to fetch activity'
			return rejectWithValue(message)
		}
	}
)
