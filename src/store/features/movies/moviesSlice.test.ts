import { describe, it, expect } from 'vitest'
import moviesReducer, {
	setMovieFilters,
	invalidateMovieCache,
	clearCurrentMovie,
	resetMoviesState,
} from '@/store/features/movies/moviesSlice'
import { fetchMovies, fetchMovieById } from '@/store/features/movies/thunk'
import {
	selectMovies,
	selectCurrentMovie,
	selectMoviesLoading,
	selectMoviesError,
	selectMoviesPagination,
	selectMoviesFilters,
	selectMoviesIsDataFresh,
} from '@/store/features/movies/selector'
import type { MoviesState } from '@/models/store/MoviesState'
import { createMoviesState, createMovieDetailDto } from '@/test/factories'

const initial: MoviesState = {
	movies: [],
	currentMovie: null,
	loading: false,
	error: null,
	pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
	filters: {},
	lastAppliedFilters: null,
	isDataFresh: false,
}

describe('moviesSlice – reducers', () => {
	it('returns initial state', () => {
		expect(moviesReducer(undefined, { type: 'unknown' })).toEqual(initial)
	})

	it('setMovieFilters updates filters and invalidates data', () => {
		const state = moviesReducer({ ...initial, isDataFresh: true }, setMovieFilters({ page: 3 }))
		expect(state.filters).toEqual({ page: 3 })
		expect(state.isDataFresh).toBe(false)
	})

	it('invalidateMovieCache sets isDataFresh=false', () => {
		const state = moviesReducer({ ...initial, isDataFresh: true }, invalidateMovieCache())
		expect(state.isDataFresh).toBe(false)
	})

	it('clearCurrentMovie resets currentMovie', () => {
		const prev = createMoviesState({ currentMovie: createMovieDetailDto() })
		const state = moviesReducer(prev, clearCurrentMovie())
		expect(state.currentMovie).toBeNull()
	})

	it('resetMoviesState returns initial', () => {
		const prev = createMoviesState({ loading: true, error: 'e' })
		expect(moviesReducer(prev, resetMoviesState())).toEqual(initial)
	})
})

describe('moviesSlice – thunk extra reducers', () => {
	it('fetchMovies.pending sets loading', () => {
		const state = moviesReducer(initial, { type: fetchMovies.pending.type })
		expect(state.loading).toBe(true)
	})

	it('fetchMovies.fulfilled sets movies and pagination', () => {
		const payload = {
			data: [{ id: 1, title: 'M' }],
			page: 1,
			pageSize: 20,
			totalCount: 1,
			totalPages: 1,
		}
		const state = moviesReducer(initial, {
			type: fetchMovies.fulfilled.type,
			payload,
			meta: { arg: {} },
		})
		expect(state.movies).toHaveLength(1)
		expect(state.isDataFresh).toBe(true)
	})

	it('fetchMovies.rejected sets error', () => {
		const state = moviesReducer(initial, {
			type: fetchMovies.rejected.type,
			payload: 'Fail',
		})
		expect(state.error).toBe('Fail')
	})

	it('fetchMovieById.fulfilled sets currentMovie', () => {
		const movie = createMovieDetailDto({ id: 7, title: 'Test Movie' })
		const state = moviesReducer(initial, {
			type: fetchMovieById.fulfilled.type,
			payload: movie,
		})
		expect(state.currentMovie?.id).toBe(7)
	})

	it('fetchMovieById.rejected sets error', () => {
		const state = moviesReducer(initial, {
			type: fetchMovieById.rejected.type,
			payload: 'Not found',
		})
		expect(state.error).toBe('Not found')
	})
})

describe('movies selectors', () => {
	const root = {
		movies: createMoviesState({
			movies: [{ id: 1 }] as any,
			loading: true,
			error: 'err',
			pagination: { page: 2, pageSize: 20, totalCount: 50, totalPages: 3 },
			filters: { sortBy: 'title' },
			isDataFresh: false,
		}),
	} as any

	it('selectMovies', () => expect(selectMovies(root)).toEqual([{ id: 1 }]))
	it('selectCurrentMovie', () => expect(selectCurrentMovie(root)).toBeNull())
	it('selectMoviesLoading', () => expect(selectMoviesLoading(root)).toBe(true))
	it('selectMoviesError', () => expect(selectMoviesError(root)).toBe('err'))
	it('selectMoviesPagination', () => expect(selectMoviesPagination(root).page).toBe(2))
	it('selectMoviesFilters', () => expect(selectMoviesFilters(root)).toEqual({ sortBy: 'title' }))
	it('selectMoviesIsDataFresh', () => expect(selectMoviesIsDataFresh(root)).toBe(false))
})

describe('moviesSlice – edge cases', () => {
	it('fetchMovieById.pending sets loading and clears error', () => {
		const state = moviesReducer({ ...initial, error: 'old' }, { type: fetchMovieById.pending.type })
		expect(state.loading).toBe(true)
		expect(state.error).toBeNull()
	})

	it('clearCurrentMovie preserves other state', () => {
		const prev = createMoviesState({
			currentMovie: createMovieDetailDto(),
			loading: false,
			movies: [{ id: 1 }] as any,
		})
		const state = moviesReducer(prev, clearCurrentMovie())
		expect(state.currentMovie).toBeNull()
		expect(state.movies).toHaveLength(1)
	})

	it('resetMoviesState clears all data', () => {
		const prev = createMoviesState({
			movies: [{ id: 1 }] as any,
			isDataFresh: true,
			loading: true,
		})
		const state = moviesReducer(prev, resetMoviesState())
		expect(state.movies).toEqual([])
		expect(state.isDataFresh).toBe(false)
	})

	it('setMovieFilters replaces all filters', () => {
		const prev = { ...initial, filters: { sortBy: 'title', page: 2 } }
		const state = moviesReducer(prev, setMovieFilters({ page: 1 }))
		expect(state.filters).toEqual({ page: 1 })
	})

	it('invalidateMovieCache preserves movie data', () => {
		const prev = createMoviesState({ movies: [{ id: 1 }] as any, isDataFresh: true })
		const state = moviesReducer(prev, invalidateMovieCache())
		expect(state.movies).toHaveLength(1)
		expect(state.isDataFresh).toBe(false)
	})

	it('fetchMovies.fulfilled stores lastAppliedFilters', () => {
		const payload = { data: [], page: 2, pageSize: 20, totalCount: 0, totalPages: 0 }
		const state = moviesReducer(initial, {
			type: fetchMovies.fulfilled.type,
			payload,
			meta: { arg: { page: 2, sortBy: 'title' } },
		})
		expect(state.lastAppliedFilters).toEqual({ page: 2, sortBy: 'title' })
	})

	it('fetchMovies.rejected clears loading', () => {
		const state = moviesReducer(
			{ ...initial, loading: true },
			{
				type: fetchMovies.rejected.type,
				payload: 'error',
			}
		)
		expect(state.loading).toBe(false)
	})

	it('fetchMovieById.fulfilled clears loading', () => {
		const movie = createMovieDetailDto({ id: 1 })
		const state = moviesReducer(
			{ ...initial, loading: true },
			{
				type: fetchMovieById.fulfilled.type,
				payload: movie,
			}
		)
		expect(state.loading).toBe(false)
	})
})
