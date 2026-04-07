import { createAsyncThunk } from '@reduxjs/toolkit'
import { getMovies, getMovieById } from '@/services/MediaService/MediaService'
import type { MediaQueryParameters } from '@/models/api'

const DEFAULT_PAGE_SIZE = 20

export const fetchMovies = createAsyncThunk(
	'movies/fetchMovies',
	async (params: MediaQueryParameters = {}, { rejectWithValue }) => {
		try {
			const query = { pageSize: DEFAULT_PAGE_SIZE, ...params }
			return await getMovies(query)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to fetch movies'
			return rejectWithValue(message)
		}
	}
)

export const fetchMovieById = createAsyncThunk(
	'movies/fetchMovieById',
	async ({ id, profileId }: { id: number; profileId?: number | null }, { rejectWithValue }) => {
		try {
			return await getMovieById(id, profileId ?? undefined)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to fetch movie'
			return rejectWithValue(message)
		}
	}
)
