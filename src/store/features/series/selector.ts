import type { RootState } from '@/store'

export const selectSeries = (state: RootState) => state.series.series
export const selectCurrentSeries = (state: RootState) => state.series.currentSeries
export const selectSeriesLoading = (state: RootState) => state.series.loading
export const selectSeriesError = (state: RootState) => state.series.error
export const selectSeriesPagination = (state: RootState) => state.series.pagination
export const selectSeriesFilters = (state: RootState) => state.series.filters
export const selectSeriesIsDataFresh = (state: RootState) => state.series.isDataFresh
export const selectSeriesLastAppliedFilters = (state: RootState) => state.series.lastAppliedFilters
