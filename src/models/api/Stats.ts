export interface WrappedDto {
	year: number
	totalEpisodesWatched: number
	totalMoviesWatched: number
	totalSeriesWatched: number
	totalMinutesWatched: number
	totalDaysActive: number
	longestStreakDays: number
	busiestDay: string | null
	busiestDayCount: number
	monthlyActivity: MonthlyActivityDto[]
	topSeries: TopSeriesDto[]
	topMovies: TopMovieDto[]
	firstWatch: WrappedMediaDto | null
	mostActiveMonth: string | null
	mostActiveMonthCount: number
	topNetworks: TopNetworkDto[]
}

export interface MonthlyActivityDto {
	month: number
	episodeCount: number
	movieCount: number
	minutesWatched: number
	series: MonthlySeriesDto[]
	movies: MonthlyMovieDto[]
}

export interface MonthlySeriesDto {
	mediaItemId: number
	title: string
	episodeCount: number
	episodes: MonthlyEpisodeDto[]
}

export interface MonthlyEpisodeDto {
	seasonNumber: number
	episodeNumber: number
	episodeName: string | null
	watchedAt: string
}

export interface MonthlyMovieDto {
	mediaItemId: number
	title: string
	watchedAt: string
	userRating: number | null
	tmdbRating: number | null
	releaseDate: string | null
}

export interface TopSeriesDto {
	mediaItemId: number
	title: string
	episodesWatched: number
	minutesWatched: number
	userRating: number | null
	tmdbRating: number | null
}

export interface TopMovieDto {
	mediaItemId: number
	title: string
	runtime: number | null
	userRating: number | null
	tmdbRating: number | null
	releaseDate: string | null
	watchedAt: string
}

export interface WrappedMediaDto {
	mediaItemId: number
	title: string
	mediaType: string
	timestamp: string
	releaseDate: string | null
	userRating: number | null
	tmdbRating: number | null
}

export interface TopNetworkDto {
	network: string
	count: number
}

export interface CalendarDayDto {
	date: string
	events: CalendarEventDto[]
}

export interface CalendarEventDto {
	mediaItemId: number
	title: string
	mediaType: string
	episodeName: string | null
	seasonNumber: number | null
	episodeNumber: number | null
	timestamp: string
}

export interface ImportPreviewDto {
	totalRows: number
	validRows: number
	duplicateRows: number
	notFoundRows: number
	errors: string[]
	rows: ImportRowDto[]
}

export interface ImportRowDto {
	type: string
	title: string
	tmdbId: number | null
	imdbId: string | null
	seasonNumber: number | null
	episodeNumber: number | null
	episodeName: string | null
	state: string
	rating: number | null
	watchedAt: string | null
	isDuplicate: boolean
	isNotFound: boolean
	willBeAdded: boolean
}

export interface ImportResultDto {
	imported: number
	skipped: number
	errors: string[]
}

export interface UpcomingEpisodeDto {
	mediaItemId: number
	seriesTitle: string
	seasonNumber: number
	episodeNumber: number
	episodeName: string | null
	airDate: string
}
