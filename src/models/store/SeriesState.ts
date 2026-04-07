import type { SeriesListDto, SeriesDetailDto, MediaQueryParameters } from '../api'

export interface SeriesState {
	series: SeriesListDto[]
	currentSeries: SeriesDetailDto | null
	loading: boolean
	error: string | null
	pagination: PaginationState
	filters: MediaQueryParameters
	lastAppliedFilters: MediaQueryParameters | null
	isDataFresh: boolean
}

export interface PaginationState {
	page: number
	pageSize: number
	totalCount: number
	totalPages: number
}
