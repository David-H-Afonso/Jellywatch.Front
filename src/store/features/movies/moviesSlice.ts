import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MoviesState } from '@/models/store/MoviesState'
import type { MediaQueryParameters } from '@/models/api'
import { fetchMovies, fetchMovieById } from './thunk'

const initialState: MoviesState = {
	movies: [],
	currentMovie: null,
	loading: false,
	error: null,
	pagination: {
		page: 1,
		pageSize: 20,
		totalCount: 0,
		totalPages: 0,
	},
	filters: {},
	lastAppliedFilters: null,
	isDataFresh: false,
}

const moviesSlice = createSlice({
	name: 'movies',
	initialState,
	reducers: {
		setFilters: (state, action: PayloadAction<MediaQueryParameters>) => {
			state.filters = action.payload
			state.isDataFresh = false
		},
		invalidateCache: (state) => {
			state.isDataFresh = false
		},
		clearCurrentMovie: (state) => {
			state.currentMovie = null
		},
		resetState: () => initialState,
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchMovies.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchMovies.fulfilled, (state, action) => {
				state.loading = false
				state.movies = action.payload.data
				state.pagination = {
					page: action.payload.page,
					pageSize: action.payload.pageSize,
					totalCount: action.payload.totalCount,
					totalPages: action.payload.totalPages,
				}
				state.lastAppliedFilters = action.meta.arg || {}
				state.isDataFresh = true
			})
			.addCase(fetchMovies.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to fetch movies'
			})

		builder
			.addCase(fetchMovieById.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchMovieById.fulfilled, (state, action) => {
				state.loading = false
				state.currentMovie = action.payload
			})
			.addCase(fetchMovieById.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to fetch movie detail'
			})
	},
})

export const {
	setFilters: setMovieFilters,
	invalidateCache: invalidateMovieCache,
	clearCurrentMovie,
	resetState: resetMoviesState,
} = moviesSlice.actions
export default moviesSlice.reducer
