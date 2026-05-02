import { describe, it, expect } from 'vitest'
import seriesReducer, {
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
} from '@/store/features/series/seriesSlice'
import { fetchSeries, fetchSeriesById } from '@/store/features/series/thunk'
import {
	selectSeries,
	selectCurrentSeries,
	selectSeriesLoading,
	selectSeriesError,
	selectSeriesPagination,
	selectSeriesFilters,
	selectSeriesIsDataFresh,
	selectSeriesLastAppliedFilters,
} from '@/store/features/series/selector'
import type { SeriesState } from '@/models/store/SeriesState'
import {
	createSeriesState,
	createSeriesDetailDto,
	createSeasonDto,
	createEpisodeDto,
} from '@/test/factories'

const initial: SeriesState = {
	series: [],
	currentSeries: null,
	loading: false,
	error: null,
	pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
	filters: {},
	lastAppliedFilters: null,
	isDataFresh: false,
}

describe('seriesSlice – reducers', () => {
	it('returns initial state', () => {
		expect(seriesReducer(undefined, { type: 'unknown' })).toEqual(initial)
	})

	it('setFilters updates filters and marks data as stale', () => {
		const state = seriesReducer(
			{ ...initial, isDataFresh: true },
			setFilters({ page: 2, sortBy: 'name' })
		)
		expect(state.filters).toEqual({ page: 2, sortBy: 'name' })
		expect(state.isDataFresh).toBe(false)
	})

	it('invalidateCache sets isDataFresh to false', () => {
		const state = seriesReducer({ ...initial, isDataFresh: true }, invalidateCache())
		expect(state.isDataFresh).toBe(false)
	})

	it('clearCurrentSeries sets currentSeries to null', () => {
		const prev = createSeriesState({ currentSeries: createSeriesDetailDto() })
		const state = seriesReducer(prev, clearCurrentSeries())
		expect(state.currentSeries).toBeNull()
	})

	it('resetState returns initial state', () => {
		const prev = createSeriesState({ loading: true, error: 'x' })
		expect(seriesReducer(prev, resetState())).toEqual(initial)
	})
})

describe('seriesSlice – episode/season/series watch state reducers', () => {
	const detail = createSeriesDetailDto({
		seasons: [
			createSeasonDto({
				id: 1,
				episodesSeen: 0,
				episodes: [
					createEpisodeDto({ id: 100, state: 0, watchedAt: null }),
					createEpisodeDto({ id: 101, state: 0, watchedAt: null }),
				],
			}),
		],
	})

	it('updateEpisodeWatchState marks episode as watched', () => {
		const prev: SeriesState = { ...initial, currentSeries: detail }
		const state = seriesReducer(prev, updateEpisodeWatchState({ episodeId: 100, state: 2 }))
		const ep = state.currentSeries!.seasons[0].episodes.find((e) => e.id === 100)!
		expect(ep.state).toBe(2)
		expect(state.currentSeries!.seasons[0].episodesSeen).toBe(1)
	})

	it('updateEpisodeWatchState marks episode as unwatched and decrements count', () => {
		const watched = { ...detail }
		watched.seasons[0].episodes[0].state = 2
		watched.seasons[0].episodesSeen = 1

		const prev: SeriesState = { ...initial, currentSeries: watched }
		const state = seriesReducer(
			prev,
			updateEpisodeWatchState({ episodeId: 100, state: 0, watchedAt: null })
		)
		const ep = state.currentSeries!.seasons[0].episodes.find((e) => e.id === 100)!
		expect(ep.state).toBe(0)
		expect(state.currentSeries!.seasons[0].episodesSeen).toBe(0)
	})

	it('updateEpisodeWatchState does nothing when currentSeries is null', () => {
		const state = seriesReducer(initial, updateEpisodeWatchState({ episodeId: 100, state: 2 }))
		expect(state.currentSeries).toBeNull()
	})

	it('updateEpisodeRating sets episode rating', () => {
		const prev: SeriesState = { ...initial, currentSeries: detail }
		const state = seriesReducer(prev, updateEpisodeRating({ episodeId: 100, rating: 8.5 }))
		const ep = state.currentSeries!.seasons[0].episodes.find((e) => e.id === 100)!
		expect(ep.userRating).toBe(8.5)
	})

	it('updateEpisodeRating clears rating with null', () => {
		const prev: SeriesState = { ...initial, currentSeries: detail }
		const state = seriesReducer(prev, updateEpisodeRating({ episodeId: 100, rating: null }))
		const ep = state.currentSeries!.seasons[0].episodes.find((e) => e.id === 100)!
		expect(ep.userRating).toBeNull()
	})

	it('updateSeasonRating sets season rating', () => {
		const prev: SeriesState = { ...initial, currentSeries: detail }
		const state = seriesReducer(prev, updateSeasonRating({ seasonId: 1, rating: 9 }))
		expect(state.currentSeries!.seasons[0].userRating).toBe(9)
	})

	it('updateSeriesRating sets series rating', () => {
		const prev: SeriesState = { ...initial, currentSeries: detail }
		const state = seriesReducer(prev, updateSeriesRating(7.5))
		expect(state.currentSeries!.userRating).toBe(7.5)
	})

	it('updateSeasonWatchStates marks all episodes in a season', () => {
		const prev: SeriesState = { ...initial, currentSeries: detail }
		const state = seriesReducer(prev, updateSeasonWatchStates({ seasonId: 1, state: 2 }))
		expect(state.currentSeries!.seasons[0].episodes.every((e) => e.state === 2)).toBe(true)
		expect(state.currentSeries!.seasons[0].episodesSeen).toBe(2)
	})

	it('updateSeasonWatchStates unwatches all episodes and clears watchedAt', () => {
		const watched = createSeriesDetailDto({
			seasons: [
				createSeasonDto({
					id: 1,
					episodesSeen: 2,
					episodes: [
						createEpisodeDto({ id: 100, state: 2 }),
						createEpisodeDto({ id: 101, state: 2 }),
					],
				}),
			],
		})

		const prev: SeriesState = { ...initial, currentSeries: watched }
		const state = seriesReducer(prev, updateSeasonWatchStates({ seasonId: 1, state: 0 }))
		expect(state.currentSeries!.seasons[0].episodes.every((e) => e.state === 0)).toBe(true)
		expect(state.currentSeries!.seasons[0].episodesSeen).toBe(0)
	})

	it('updateAllWatchStates marks all episodes across all seasons', () => {
		const multi = createSeriesDetailDto({
			seasons: [
				createSeasonDto({ id: 1, episodes: [createEpisodeDto({ id: 100, state: 0 })] }),
				createSeasonDto({ id: 2, episodes: [createEpisodeDto({ id: 200, state: 0 })] }),
			],
		})
		const prev: SeriesState = { ...initial, currentSeries: multi }
		const state = seriesReducer(prev, updateAllWatchStates({ state: 2 }))
		expect(state.currentSeries!.seasons.every((s) => s.episodesSeen === 1)).toBe(true)
	})
})

describe('seriesSlice – thunk extra reducers', () => {
	it('fetchSeries.pending sets loading', () => {
		const state = seriesReducer(initial, { type: fetchSeries.pending.type })
		expect(state.loading).toBe(true)
		expect(state.error).toBeNull()
	})

	it('fetchSeries.fulfilled populates series and pagination', () => {
		const payload = {
			data: [{ id: 1, title: 'S' }],
			page: 2,
			pageSize: 20,
			totalCount: 50,
			totalPages: 3,
		}
		const state = seriesReducer(initial, {
			type: fetchSeries.fulfilled.type,
			payload,
			meta: { arg: { page: 2 } },
		})
		expect(state.series).toEqual([{ id: 1, title: 'S' }])
		expect(state.pagination.page).toBe(2)
		expect(state.isDataFresh).toBe(true)
		expect(state.lastAppliedFilters).toEqual({ page: 2 })
	})

	it('fetchSeries.rejected sets error', () => {
		const state = seriesReducer(initial, {
			type: fetchSeries.rejected.type,
			payload: 'Network error',
		})
		expect(state.loading).toBe(false)
		expect(state.error).toBe('Network error')
	})

	it('fetchSeriesById.fulfilled sets currentSeries', () => {
		const detail = createSeriesDetailDto({ id: 5, title: 'Test' })
		const state = seriesReducer(initial, {
			type: fetchSeriesById.fulfilled.type,
			payload: detail,
		})
		expect(state.currentSeries?.id).toBe(5)
		expect(state.loading).toBe(false)
	})
})

describe('series selectors', () => {
	const root = {
		series: createSeriesState({
			series: [{ id: 1 }] as any,
			loading: true,
			error: 'err',
			pagination: { page: 3, pageSize: 20, totalCount: 100, totalPages: 5 },
			filters: { sortBy: 'name' },
			isDataFresh: true,
			lastAppliedFilters: { sortBy: 'name' },
		}),
	} as any

	it('selectSeries', () => expect(selectSeries(root)).toEqual([{ id: 1 }]))
	it('selectCurrentSeries', () => expect(selectCurrentSeries(root)).toBeNull())
	it('selectSeriesLoading', () => expect(selectSeriesLoading(root)).toBe(true))
	it('selectSeriesError', () => expect(selectSeriesError(root)).toBe('err'))
	it('selectSeriesPagination', () => expect(selectSeriesPagination(root).page).toBe(3))
	it('selectSeriesFilters', () => expect(selectSeriesFilters(root)).toEqual({ sortBy: 'name' }))
	it('selectSeriesIsDataFresh', () => expect(selectSeriesIsDataFresh(root)).toBe(true))
	it('selectSeriesLastAppliedFilters', () =>
		expect(selectSeriesLastAppliedFilters(root)).toEqual({ sortBy: 'name' }))

	it('selectCurrentSeries returns detail when loaded', () => {
		const detail = createSeriesDetailDto({ id: 10, title: 'Detail' })
		const s = {
			series: createSeriesState({ currentSeries: detail }),
		} as any
		expect(selectCurrentSeries(s)?.id).toBe(10)
	})

	it('selectSeriesIsDataFresh returns false when stale', () => {
		const s = { series: createSeriesState({ isDataFresh: false }) } as any
		expect(selectSeriesIsDataFresh(s)).toBe(false)
	})

	it('selectSeriesLastAppliedFilters returns null initially', () => {
		const s = { series: createSeriesState() } as any
		expect(selectSeriesLastAppliedFilters(s)).toBeNull()
	})
})

describe('seriesSlice – edge cases', () => {
	it('updateEpisodeRating does nothing when currentSeries is null', () => {
		const state = seriesReducer(initial, updateEpisodeRating({ episodeId: 100, rating: 5 }))
		expect(state.currentSeries).toBeNull()
	})

	it('updateSeasonRating does nothing when currentSeries is null', () => {
		const state = seriesReducer(initial, updateSeasonRating({ seasonId: 1, rating: 5 }))
		expect(state.currentSeries).toBeNull()
	})

	it('updateSeriesRating does nothing when currentSeries is null', () => {
		const state = seriesReducer(initial, updateSeriesRating(5))
		expect(state.currentSeries).toBeNull()
	})

	it('updateSeasonWatchStates does nothing when currentSeries is null', () => {
		const state = seriesReducer(initial, updateSeasonWatchStates({ seasonId: 1, state: 2 }))
		expect(state.currentSeries).toBeNull()
	})

	it('updateAllWatchStates does nothing when currentSeries is null', () => {
		const state = seriesReducer(initial, updateAllWatchStates({ state: 2 }))
		expect(state.currentSeries).toBeNull()
	})

	it('setFilters replaces all filters', () => {
		const prev = { ...initial, filters: { sortBy: 'name', page: 2 } }
		const state = seriesReducer(prev, setFilters({ page: 1 }))
		expect(state.filters).toEqual({ page: 1 })
	})

	it('fetchSeriesById.pending sets loading and clears error', () => {
		const state = seriesReducer(
			{ ...initial, error: 'old' },
			{ type: fetchSeriesById.pending.type }
		)
		expect(state.loading).toBe(true)
		expect(state.error).toBeNull()
	})

	it('fetchSeriesById.rejected sets error and stops loading', () => {
		const state = seriesReducer(
			{ ...initial, loading: true },
			{
				type: fetchSeriesById.rejected.type,
				payload: 'Not found',
			}
		)
		expect(state.loading).toBe(false)
		expect(state.error).toBe('Not found')
	})

	it('invalidateCache preserves series data', () => {
		const prev = createSeriesState({ series: [{ id: 1 }] as any, isDataFresh: true })
		const state = seriesReducer(prev, invalidateCache())
		expect(state.series).toHaveLength(1)
		expect(state.isDataFresh).toBe(false)
	})
})
