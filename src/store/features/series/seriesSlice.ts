import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { SeriesState } from '@/models/store/SeriesState'
import type { MediaQueryParameters } from '@/models/api'
import type { WatchState } from '@/models/api/Enums'
import { fetchSeries, fetchSeriesById } from './thunk'

const initialState: SeriesState = {
	series: [],
	currentSeries: null,
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

const seriesSlice = createSlice({
	name: 'series',
	initialState,
	reducers: {
		setFilters: (state, action: PayloadAction<MediaQueryParameters>) => {
			state.filters = action.payload
			state.isDataFresh = false
		},
		invalidateCache: (state) => {
			state.isDataFresh = false
		},
		clearCurrentSeries: (state) => {
			state.currentSeries = null
		},
		resetState: () => initialState,
		updateEpisodeWatchState: (
			state,
			action: PayloadAction<{ episodeId: number; state: WatchState }>
		) => {
			if (!state.currentSeries) return
			for (const season of state.currentSeries.seasons) {
				const ep = season.episodes.find((e) => e.id === action.payload.episodeId)
				if (ep) {
					const wasSeen = ep.state === 2
					ep.state = action.payload.state
					const nowSeen = action.payload.state === 2
					if (wasSeen && !nowSeen) season.episodesSeen = Math.max(0, season.episodesSeen - 1)
					if (!wasSeen && nowSeen) season.episodesSeen++
					break
				}
			}
		},
		updateEpisodeRating: (
			state,
			action: PayloadAction<{ episodeId: number; rating: number | null }>
		) => {
			if (!state.currentSeries) return
			for (const season of state.currentSeries.seasons) {
				const ep = season.episodes.find((e) => e.id === action.payload.episodeId)
				if (ep) {
					ep.userRating = action.payload.rating
					break
				}
			}
		},
		updateSeasonRating: (
			state,
			action: PayloadAction<{ seasonId: number; rating: number | null }>
		) => {
			if (!state.currentSeries) return
			const season = state.currentSeries.seasons.find((s) => s.id === action.payload.seasonId)
			if (season) season.userRating = action.payload.rating
		},
		updateSeriesRating: (state, action: PayloadAction<number | null>) => {
			if (!state.currentSeries) return
			state.currentSeries.userRating = action.payload
		},
		updateSeasonWatchStates: (
			state,
			action: PayloadAction<{ seasonId: number; state: WatchState }>
		) => {
			if (!state.currentSeries) return
			const season = state.currentSeries.seasons.find((s) => s.id === action.payload.seasonId)
			if (season) {
				for (const ep of season.episodes) {
					ep.state = action.payload.state
				}
				season.episodesSeen = action.payload.state === 2 ? season.episodes.length : 0
			}
		},
		updateAllWatchStates: (state, action: PayloadAction<WatchState>) => {
			if (!state.currentSeries) return
			for (const season of state.currentSeries.seasons) {
				for (const ep of season.episodes) {
					ep.state = action.payload
				}
				season.episodesSeen = action.payload === 2 ? season.episodes.length : 0
			}
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchSeries.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchSeries.fulfilled, (state, action) => {
				state.loading = false
				state.series = action.payload.data
				state.pagination = {
					page: action.payload.page,
					pageSize: action.payload.pageSize,
					totalCount: action.payload.totalCount,
					totalPages: action.payload.totalPages,
				}
				state.lastAppliedFilters = action.meta.arg || {}
				state.isDataFresh = true
			})
			.addCase(fetchSeries.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to fetch series'
			})

		builder
			.addCase(fetchSeriesById.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchSeriesById.fulfilled, (state, action) => {
				state.loading = false
				state.currentSeries = action.payload
			})
			.addCase(fetchSeriesById.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to fetch series detail'
			})
	},
})

export const {
	setFilters,
	invalidateCache,
	clearCurrentSeries,
	resetState,
	updateEpisodeWatchState,
	updateEpisodeRating,
	updateSeasonRating,
	updateSeriesRating,
	updateSeasonWatchStates,
	updateAllWatchStates,
} = seriesSlice.actions
export default seriesSlice.reducer
