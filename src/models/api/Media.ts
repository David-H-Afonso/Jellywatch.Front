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
	tmdbRating: number | null
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
	genres: string | null
	ratings: ExternalRatingDto[]
	seasons: SeasonDto[]
	spanishTranslation: TranslationDto | null
	isBlocked: boolean
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
	tmdbRating: number | null
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
	genres: string | null
	state: WatchState
	userRating: number | null
	ratings: ExternalRatingDto[]
	spanishTranslation: TranslationDto | null
	isBlocked: boolean
	watchedAt: string | null
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
	watchedAt: string | null
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
	timestamp?: string
}

export interface ActivityDto {
	id: number
	mediaItemId: number
	seriesId: number | null
	movieId: number | null
	mediaTitle: string
	episodeName: string | null
	episodeNumber: number | null
	seasonNumber: number | null
	mediaType: MediaType
	eventType: WatchEventType
	source: SyncSource
	timestamp: string
	createdAt: string
	posterPath: string | null
	userRating: number | null
	tmdbRating: number | null
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

export interface ProfileBlockedItemDto {
	id: number
	mediaItemId: number
	title: string
	spanishTitle: string | null
	mediaType: MediaType
	blockedAt: string
}

export interface AdminProfileBlockDto {
	id: number
	profileId: number
	profileName: string
	mediaItemId: number
	title: string
	spanishTitle: string | null
	mediaType: MediaType
	blockedAt: string
}

export interface CastMemberDto {
	tmdbPersonId: number
	name: string
	character: string | null
	profilePath: string | null
	totalEpisodeCount: number | null
}

export interface PersonCreditsDto {
	tmdbPersonId: number
	name: string
	profilePath: string | null
	credits: PersonCreditItemDto[]
}

export interface PersonCreditItemDto {
	localMediaItemId: number | null
	tmdbId: number
	title: string
	posterPath: string | null
	character: string | null
	mediaType: string
	releaseDate: string | null
	voteAverage: number | null
}
