import { customFetch } from '@/utils/customFetch'
import { environment } from '@/environments'
import type {
	SeriesListDto,
	SeriesDetailDto,
	MovieListDto,
	MovieDetailDto,
	SeasonDto,
	EpisodeDto,
	PagedResult,
	MediaQueryParameters,
	WatchStateUpdateDto,
	TmdbTvSearchResultDto,
	TmdbMovieSearchResultDto,
	ManualAddRequestDto,
	ManualAddResultDto,
} from '@/models/api'

const { apiRoutes } = environment

export const getSeries = async (
	params?: MediaQueryParameters
): Promise<PagedResult<SeriesListDto>> => {
	return await customFetch<PagedResult<SeriesListDto>>(apiRoutes.series.base, {
		method: 'GET',
		params: params as Record<string, string | number | boolean>,
	})
}

export const getSeriesById = async (id: number, profileId?: number): Promise<SeriesDetailDto> => {
	return await customFetch<SeriesDetailDto>(apiRoutes.series.byId(id), {
		params: profileId !== undefined ? { profileId } : undefined,
	})
}

export const getSeasons = async (seriesId: number): Promise<SeasonDto[]> => {
	return await customFetch<SeasonDto[]>(apiRoutes.series.seasons(seriesId))
}

export const getEpisodes = async (seasonId: number): Promise<EpisodeDto[]> => {
	return await customFetch<EpisodeDto[]>(apiRoutes.series.episodes(seasonId))
}

export const getMovies = async (
	params?: MediaQueryParameters
): Promise<PagedResult<MovieListDto>> => {
	return await customFetch<PagedResult<MovieListDto>>(apiRoutes.movies.base, {
		method: 'GET',
		params: params as Record<string, string | number | boolean>,
	})
}

export const getMovieById = async (id: number, profileId?: number): Promise<MovieDetailDto> => {
	return await customFetch<MovieDetailDto>(apiRoutes.movies.byId(id), {
		params: profileId !== undefined ? { profileId } : undefined,
	})
}

export const updateEpisodeState = async (
	profileId: number,
	episodeId: number,
	data: WatchStateUpdateDto
): Promise<void> => {
	await customFetch<void>(apiRoutes.profile.episodeState(profileId, episodeId), {
		method: 'PATCH',
		body: data,
	})
}

export const updateMovieState = async (
	profileId: number,
	movieId: number,
	data: WatchStateUpdateDto
): Promise<void> => {
	await customFetch<void>(apiRoutes.profile.movieState(profileId, movieId), {
		method: 'PATCH',
		body: data,
	})
}

export const setSeasonState = async (
	profileId: number,
	seasonId: number,
	state: WatchStateUpdateDto['state']
): Promise<void> => {
	await customFetch<void>(apiRoutes.profile.seasonState(profileId, seasonId), {
		method: 'PATCH',
		body: { state },
	})
}

export const setSeriesAllState = async (
	profileId: number,
	seriesId: number,
	state: WatchStateUpdateDto['state']
): Promise<void> => {
	await customFetch<void>(apiRoutes.profile.seriesState(profileId, seriesId), {
		method: 'PATCH',
		body: { state },
	})
}

export const rateMovie = async (
	movieId: number,
	profileId: number,
	rating: number | null
): Promise<void> => {
	await customFetch<void>(apiRoutes.movies.rating(movieId), {
		method: 'PATCH',
		params: { profileId },
		body: { rating },
	})
}

export const rateSeries = async (
	seriesId: number,
	profileId: number,
	rating: number | null
): Promise<void> => {
	await customFetch<void>(apiRoutes.series.rating(seriesId), {
		method: 'PATCH',
		params: { profileId },
		body: { rating },
	})
}

export const rateEpisode = async (
	seriesId: number,
	episodeId: number,
	profileId: number,
	rating: number | null
): Promise<void> => {
	await customFetch<void>(apiRoutes.series.episodeRating(seriesId, episodeId), {
		method: 'PATCH',
		params: { profileId },
		body: { rating },
	})
}

export const rateSeason = async (
	seriesId: number,
	seasonId: number,
	profileId: number,
	rating: number | null
): Promise<void> => {
	await customFetch<void>(apiRoutes.series.seasonRating(seriesId, seasonId), {
		method: 'PATCH',
		params: { profileId },
		body: { rating },
	})
}

export const uploadCustomPoster = async (mediaItemId: number, file: File): Promise<void> => {
	const formData = new FormData()
	formData.append('file', file)
	await customFetch<void>(apiRoutes.asset.customPoster(mediaItemId), {
		method: 'POST',
		body: formData,
	})
}

export const searchTmdb = async (
	query: string,
	type: 'series' | 'movie',
	year?: number
): Promise<TmdbTvSearchResultDto[] | TmdbMovieSearchResultDto[]> => {
	return await customFetch<TmdbTvSearchResultDto[] | TmdbMovieSearchResultDto[]>(
		apiRoutes.mediaSearch.tmdb,
		{ params: { query, type, ...(year ? { year } : {}) } }
	)
}

export const addManually = async (dto: ManualAddRequestDto): Promise<ManualAddResultDto> => {
	return await customFetch<ManualAddResultDto>(apiRoutes.mediaSearch.add, {
		method: 'POST',
		body: dto,
	})
}
