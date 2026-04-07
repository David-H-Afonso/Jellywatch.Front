import type { ExternalProvider, MediaType, SyncSource, WatchEventType, WatchState } from './Enums'

export interface SeriesListDto {
	id: number
	mediaItemId: number
	title: string
	posterPath: string | null
	status: string | null
	totalSeasons: number | null
	totalEpisodes: number | null
	episodesSeen: number
	aggregateState: WatchState
	releaseDate: string | null
	userRating: number | null
}

export interface SeriesDetailDto {
	id: number
	mediaItemId: number
	title: string
	originalTitle: string | null
	overview: string | null
	posterPath: string | null
	backdropPath: string | null
	releaseDate: string | null
	status: string | null
	originalLanguage: string | null
	network: string | null
	totalSeasons: number | null
	totalEpisodes: number | null
	userRating: number | null
	ratings: ExternalRatingDto[]
	seasons: SeasonDto[]
	spanishTranslation: TranslationDto | null
}

export interface MovieListDto {
	id: number
	mediaItemId: number
	title: string
	posterPath: string | null
	runtime: number | null
	state: WatchState
	releaseDate: string | null
	userRating: number | null
}

export interface MovieDetailDto {
	id: number
	mediaItemId: number
	title: string
	originalTitle: string | null
	overview: string | null
	posterPath: string | null
	backdropPath: string | null
	releaseDate: string | null
	originalLanguage: string | null
	runtime: number | null
	state: WatchState
	userRating: number | null
	ratings: ExternalRatingDto[]
	spanishTranslation: TranslationDto | null
}

export interface SeasonDto {
	id: number
	seasonNumber: number
	name: string | null
	overview: string | null
	posterPath: string | null
	posterUrl: string | null
	episodeCount: number | null
	airDate: string | null
	tmdbRating: number | null
	episodesSeen: number
	userRating: number | null
	episodes: EpisodeDto[]
}

export interface EpisodeDto {
	id: number
	episodeNumber: number
	name: string | null
	overview: string | null
	stillPath: string | null
	stillUrl: string | null
	airDate: string | null
	runtime: number | null
	tmdbRating: number | null
	state: WatchState
	isManualOverride: boolean
	userRating: number | null
}

export interface PosterOptionDto {
	id: number
	remoteUrl: string
	thumbnailUrl: string
	width: number | null
	height: number | null
	language: string | null
}

export interface ExternalRatingDto {
	provider: ExternalProvider
	score: string | null
	voteCount: number | null
}

export interface TranslationDto {
	language: string
	title: string | null
	overview: string | null
}

export interface WatchStateUpdateDto {
	state: WatchState
}

export interface ActivityDto {
	id: number
	mediaTitle: string
	episodeName: string | null
	episodeNumber: number | null
	seasonNumber: number | null
	mediaType: MediaType
	eventType: WatchEventType
	source: SyncSource
	timestamp: string
	posterPath: string | null
}

// TMDB Search result DTOs — property names match backend JsonPropertyName attributes (snake_case)
export interface TmdbTvSearchResultDto {
	id: number
	name: string | null
	original_name: string | null
	overview: string | null
	poster_path: string | null
	first_air_date: string | null
	vote_average: number
	vote_count: number
	original_language: string | null
}

export interface TmdbMovieSearchResultDto {
	id: number
	title: string | null
	original_title: string | null
	overview: string | null
	poster_path: string | null
	release_date: string | null
	vote_average: number
	vote_count: number
	original_language: string | null
}

export interface ManualAddRequestDto {
	tmdbId: number
	type: 'series' | 'movie'
	profileId: number
}

export interface ManualAddResultDto {
	message: string
	mediaItemId: number
	seriesId?: number
	movieId?: number
	title: string
}
