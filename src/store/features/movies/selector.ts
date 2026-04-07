import type { RootState } from '@/store'

export const selectMovies = (state: RootState) => state.movies.movies
export const selectCurrentMovie = (state: RootState) => state.movies.currentMovie
export const selectMoviesLoading = (state: RootState) => state.movies.loading
export const selectMoviesError = (state: RootState) => state.movies.error
export const selectMoviesPagination = (state: RootState) => state.movies.pagination
export const selectMoviesFilters = (state: RootState) => state.movies.filters
export const selectMoviesIsDataFresh = (state: RootState) => state.movies.isDataFresh
