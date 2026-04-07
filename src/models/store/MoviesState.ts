import type { MovieListDto, MovieDetailDto, MediaQueryParameters } from '../api'
import type { PaginationState } from './SeriesState'

export interface MoviesState {
	movies: MovieListDto[]
	currentMovie: MovieDetailDto | null
	loading: boolean
	error: string | null
	pagination: PaginationState
	filters: MediaQueryParameters
	lastAppliedFilters: MediaQueryParameters | null
	isDataFresh: boolean
}
