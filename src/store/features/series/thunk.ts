import { createAsyncThunk } from '@reduxjs/toolkit'
import { getSeries, getSeriesById } from '@/services/MediaService/MediaService'
import type { MediaQueryParameters } from '@/models/api'

const DEFAULT_PAGE_SIZE = 20

export const fetchSeries = createAsyncThunk(
	'series/fetchSeries',
	async (params: MediaQueryParameters = {}, { rejectWithValue }) => {
		try {
			const query = { pageSize: DEFAULT_PAGE_SIZE, ...params }
			return await getSeries(query)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to fetch series'
			return rejectWithValue(message)
		}
	}
)

export const fetchSeriesById = createAsyncThunk(
	'series/fetchSeriesById',
	async ({ id, profileId }: { id: number; profileId?: number | null }, { rejectWithValue }) => {
		try {
			return await getSeriesById(id, profileId ?? undefined)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to fetch series'
			return rejectWithValue(message)
		}
	}
)
