import {
	WatchState,
	MediaType,
	WatchEventType,
	SyncSource,
	SyncJobType,
	SyncJobStatus,
	ExternalProvider,
} from '@/models/api/Enums'
import type {
	LoginResponse,
	UserMeResponse,
	UserDto,
	ProfileDto,
	ProfileDetailDto,
	PropagationRuleDto,
	JellyfinUserDto,
} from '@/models/api/Auth'
import type {
	SeriesListDto,
	SeriesDetailDto,
	MovieListDto,
	MovieDetailDto,
	SeasonDto,
	EpisodeDto,
	ActivityDto,
	CastMemberDto,
	PersonCreditsDto,
	ExternalRatingDto,
} from '@/models/api/Media'
import type { NoteDto } from '@/models/api/Note'
import type { PagedResult, MediaQueryParameters } from '@/models/api/Common'
import type {
	ProviderSettingsDto,
	SyncJobDto,
	WebhookEventLogDto,
	ImportQueueItemDto,
	MediaLibraryItemDto,
	BlacklistedItemDto,
} from '@/models/api/Sync'
import type { WrappedDto, CalendarDayDto, UpcomingEpisodeDto } from '@/models/api/Stats'
import type { AuthState, ProfileInfo } from '@/models/store/AuthState'
import type { SeriesState } from '@/models/store/SeriesState'
import type { MoviesState } from '@/models/store/MoviesState'
import type { ProfileState } from '@/models/store/ProfileState'
import type { SettingsState, AdminState } from '@/models/store/SettingsState'

// ── Counters ────────────────────────────────────────────────────────
let _id = 1
const nextId = () => _id++
export const resetFactoryIds = () => {
	_id = 1
}

// ── Auth ────────────────────────────────────────────────────────────
export const createLoginResponse = (overrides?: Partial<LoginResponse>): LoginResponse => ({
	userId: nextId(),
	username: 'testuser',
	token: 'test-jwt-token',
	isAdmin: false,
	...overrides,
})

export const createProfileInfo = (overrides?: Partial<ProfileInfo>): ProfileInfo => ({
	id: nextId(),
	displayName: 'Main Profile',
	jellyfinUserId: 'jf-user-1',
	isJoint: false,
	...overrides,
})

export const createUserMeResponse = (overrides?: Partial<UserMeResponse>): UserMeResponse => ({
	id: nextId(),
	jellyfinUserId: 'jf-user-1',
	username: 'testuser',
	isAdmin: false,
	avatarUrl: null,
	preferredLanguage: 'en',
	profiles: [createProfile()],
	...overrides,
})

export const createUserDto = (overrides?: Partial<UserDto>): UserDto => ({
	id: nextId(),
	username: 'testuser',
	jellyfinUserId: 'jf-user-1',
	isAdmin: false,
	avatarUrl: null,
	preferredLanguage: 'en',
	createdAt: '2025-01-01T00:00:00Z',
	...overrides,
})

export const createProfile = (overrides?: Partial<ProfileDto>): ProfileDto => ({
	id: nextId(),
	displayName: 'Main Profile',
	jellyfinUserId: 'jf-user-1',
	isJoint: false,
	...overrides,
})

export const createProfileDetailDto = (
	overrides?: Partial<ProfileDetailDto>
): ProfileDetailDto => ({
	id: nextId(),
	displayName: 'Main Profile',
	jellyfinUserId: 'jf-user-1',
	isJoint: false,
	totalSeriesWatching: 5,
	totalSeriesCompleted: 10,
	totalMoviesSeen: 20,
	totalEpisodesSeen: 150,
	...overrides,
})

export const createJellyfinUserDto = (overrides?: Partial<JellyfinUserDto>): JellyfinUserDto => ({
	id: 'jf-id-1',
	name: 'JellyfinUser',
	isAdministrator: false,
	alreadyTracked: false,
	...overrides,
})

// ── Series ──────────────────────────────────────────────────────────
export const createSeriesListDto = (overrides?: Partial<SeriesListDto>): SeriesListDto => ({
	id: nextId(),
	mediaItemId: nextId(),
	title: 'Test Series',
	posterPath: '/poster.jpg',
	status: 'Returning Series',
	totalSeasons: 3,
	totalEpisodes: 30,
	episodesSeen: 10,
	aggregateState: WatchState.InProgress,
	releaseDate: '2023-01-15',
	userRating: null,
	tmdbRating: 8.5,
	...overrides,
})

export const createEpisodeDto = (overrides?: Partial<EpisodeDto>): EpisodeDto => ({
	id: nextId(),
	episodeNumber: 1,
	name: 'Pilot',
	overview: 'The first episode',
	stillPath: null,
	stillUrl: null,
	airDate: '2023-01-15',
	runtime: 45,
	tmdbRating: 8.0,
	state: WatchState.Unseen,
	isManualOverride: false,
	userRating: null,
	watchedAt: null,
	...overrides,
})

export const createSeasonDto = (overrides?: Partial<SeasonDto>): SeasonDto => ({
	id: nextId(),
	seasonNumber: 1,
	name: 'Season 1',
	overview: null,
	posterPath: null,
	posterUrl: null,
	episodeCount: 10,
	airDate: '2023-01-15',
	tmdbRating: 8.0,
	episodesSeen: 0,
	userRating: null,
	episodes: [createEpisodeDto(), createEpisodeDto({ episodeNumber: 2, name: 'Episode 2' })],
	...overrides,
})

export const createSeriesDetailDto = (overrides?: Partial<SeriesDetailDto>): SeriesDetailDto => ({
	id: nextId(),
	mediaItemId: nextId(),
	tmdbId: 12345,
	title: 'Test Series',
	originalTitle: 'Test Series Original',
	overview: 'A great test series',
	posterPath: '/poster.jpg',
	backdropPath: '/backdrop.jpg',
	releaseDate: '2023-01-15',
	status: 'Returning Series',
	originalLanguage: 'en',
	network: 'HBO',
	totalSeasons: 3,
	totalEpisodes: 30,
	userRating: null,
	genres: 'Drama, Sci-Fi',
	ratings: [],
	seasons: [createSeasonDto()],
	spanishTranslation: null,
	isBlocked: false,
	isInLibrary: true,
	...overrides,
})

export const createExternalRatingDto = (
	overrides?: Partial<ExternalRatingDto>
): ExternalRatingDto => ({
	provider: ExternalProvider.Tmdb,
	score: '8.5',
	voteCount: 1000,
	...overrides,
})

// ── Movies ──────────────────────────────────────────────────────────
export const createMovieListDto = (overrides?: Partial<MovieListDto>): MovieListDto => ({
	id: nextId(),
	mediaItemId: nextId(),
	title: 'Test Movie',
	posterPath: '/movie-poster.jpg',
	runtime: 120,
	state: WatchState.Unseen,
	releaseDate: '2024-06-15',
	userRating: null,
	tmdbRating: 7.5,
	...overrides,
})

export const createMovieDetailDto = (overrides?: Partial<MovieDetailDto>): MovieDetailDto => ({
	id: nextId(),
	mediaItemId: nextId(),
	title: 'Test Movie',
	originalTitle: 'Test Movie Original',
	overview: 'A great test movie',
	posterPath: '/movie-poster.jpg',
	backdropPath: '/movie-backdrop.jpg',
	releaseDate: '2024-06-15',
	originalLanguage: 'en',
	runtime: 120,
	genres: 'Action, Thriller',
	state: WatchState.Unseen,
	userRating: null,
	ratings: [],
	spanishTranslation: null,
	isBlocked: false,
	watchedAt: null,
	...overrides,
})

// ── Activity ────────────────────────────────────────────────────────
export const createActivityDto = (overrides?: Partial<ActivityDto>): ActivityDto => ({
	id: nextId(),
	mediaItemId: 1,
	seriesId: 1,
	movieId: null,
	mediaTitle: 'Test Series',
	episodeName: 'Pilot',
	episodeNumber: 1,
	seasonNumber: 1,
	mediaType: MediaType.Series,
	eventType: WatchEventType.Finished,
	source: SyncSource.Webhook,
	timestamp: '2025-01-15T20:00:00Z',
	createdAt: '2025-01-15T20:00:00Z',
	posterPath: '/poster.jpg',
	userRating: null,
	tmdbRating: 8.0,
	...overrides,
})

// ── Cast ────────────────────────────────────────────────────────────
export const createCastMemberDto = (overrides?: Partial<CastMemberDto>): CastMemberDto => ({
	tmdbPersonId: nextId(),
	name: 'Test Actor',
	character: 'Main Character',
	profilePath: '/actor.jpg',
	totalEpisodeCount: 10,
	...overrides,
})

export const createPersonCreditsDto = (
	overrides?: Partial<PersonCreditsDto>
): PersonCreditsDto => ({
	tmdbPersonId: 1,
	name: 'Test Actor',
	profilePath: '/actor.jpg',
	credits: [],
	...overrides,
})

// ── Notes ───────────────────────────────────────────────────────────
export const createNoteDto = (overrides?: Partial<NoteDto>): NoteDto => ({
	id: nextId(),
	mediaItemId: 1,
	seasonId: null,
	episodeId: null,
	text: 'Test note content',
	createdAt: '2025-01-15T00:00:00Z',
	updatedAt: '2025-01-15T00:00:00Z',
	...overrides,
})

// ── Settings ────────────────────────────────────────────────────────
export const createProviderSettingsDto = (
	overrides?: Partial<ProviderSettingsDto>
): ProviderSettingsDto => ({
	tmdbEnabled: true,
	tmdbHasApiKey: true,
	omdbEnabled: false,
	omdbHasApiKey: false,
	tvMazeEnabled: true,
	primaryLanguage: 'en',
	fallbackLanguage: 'es',
	...overrides,
})

export const createPropagationRuleDto = (
	overrides?: Partial<PropagationRuleDto>
): PropagationRuleDto => ({
	id: nextId(),
	sourceProfileId: 1,
	sourceProfileName: 'Main Profile',
	targetProfileId: 2,
	targetProfileName: 'Secondary Profile',
	isActive: true,
	...overrides,
})

// ── Sync ────────────────────────────────────────────────────────────
export const createSyncJobDto = (overrides?: Partial<SyncJobDto>): SyncJobDto => ({
	id: nextId(),
	type: SyncJobType.Full,
	status: SyncJobStatus.Completed,
	profileId: null,
	profileName: null,
	startedAt: '2025-01-15T10:00:00Z',
	completedAt: '2025-01-15T10:05:00Z',
	itemsProcessed: 50,
	errorMessage: null,
	...overrides,
})

export const createWebhookLogDto = (
	overrides?: Partial<WebhookEventLogDto>
): WebhookEventLogDto => ({
	id: nextId(),
	eventType: 'UserDataSaved',
	receivedAt: '2025-01-15T10:00:00Z',
	processedAt: '2025-01-15T10:00:01Z',
	success: true,
	errorMessage: null,
	...overrides,
})

export const createImportQueueItemDto = (
	overrides?: Partial<ImportQueueItemDto>
): ImportQueueItemDto => ({
	id: nextId(),
	jellyfinItemId: 'jf-item-1',
	mediaType: 'Series',
	priority: 0,
	status: 'Pending',
	retryCount: 0,
	createdAt: '2025-01-15T00:00:00Z',
	...overrides,
})

export const createMediaLibraryItemDto = (
	overrides?: Partial<MediaLibraryItemDto>
): MediaLibraryItemDto => ({
	id: nextId(),
	title: 'Library Item',
	mediaType: 'Series',
	posterPath: '/poster.jpg',
	releaseDate: '2023-01-15',
	status: 'Active',
	tmdbId: 12345,
	tvMazeId: null,
	imdbId: 'tt1234567',
	createdAt: '2025-01-01T00:00:00Z',
	...overrides,
})

export const createBlacklistedItemDto = (
	overrides?: Partial<BlacklistedItemDto>
): BlacklistedItemDto => ({
	id: nextId(),
	jellyfinItemId: 'jf-blacklisted-1',
	displayName: 'Blacklisted Item',
	reason: 'Not relevant',
	createdAt: '2025-01-15T00:00:00Z',
	...overrides,
})

// ── Stats ───────────────────────────────────────────────────────────
export const createWrappedDto = (overrides?: Partial<WrappedDto>): WrappedDto => ({
	year: 2025,
	totalEpisodesWatched: 500,
	totalMoviesWatched: 50,
	totalSeriesWatched: 20,
	totalMinutesWatched: 30000,
	totalDaysActive: 200,
	longestStreakDays: 15,
	busiestDay: '2025-06-15',
	busiestDayCount: 12,
	monthlyActivity: [],
	topSeries: [],
	topMovies: [],
	firstWatch: null,
	mostActiveMonth: 'June',
	mostActiveMonthCount: 80,
	topNetworks: [],
	genreBreakdown: [],
	monthlyGenreInsights: [],
	...overrides,
})

export const createCalendarDayDto = (overrides?: Partial<CalendarDayDto>): CalendarDayDto => ({
	date: '2025-01-15',
	events: [],
	...overrides,
})

export const createUpcomingEpisodeDto = (
	overrides?: Partial<UpcomingEpisodeDto>
): UpcomingEpisodeDto => ({
	mediaItemId: 1,
	seriesId: 1,
	seriesTitle: 'Test Series',
	seasonNumber: 2,
	episodeNumber: 5,
	episodeName: 'Upcoming Episode',
	airDate: '2025-02-01',
	airTime: '21:00',
	airTimeUtc: '2025-02-01T21:00:00Z',
	batchCount: 1,
	...overrides,
})

// ── Paged Results ───────────────────────────────────────────────────
export const createPagedResult = <T>(
	data: T[],
	overrides?: Partial<PagedResult<T>>
): PagedResult<T> => ({
	data,
	totalCount: data.length,
	page: 1,
	pageSize: 20,
	totalPages: 1,
	...overrides,
})

// ── Media Query Parameters ──────────────────────────────────────────
export const createMediaQueryParameters = (
	overrides?: Partial<MediaQueryParameters>
): MediaQueryParameters => ({
	page: 1,
	pageSize: 20,
	...overrides,
})

// ── Store States ────────────────────────────────────────────────────
export const createAuthState = (overrides?: Partial<AuthState>): AuthState => ({
	isAuthenticated: true,
	user: {
		id: 1,
		username: 'testuser',
		isAdmin: false,
		avatarUrl: null,
		preferredLanguage: 'en',
		jellyfinUserId: 'jf-user-1',
		profiles: [createProfileInfo()],
		activeProfileId: 1,
	},
	token: 'test-jwt-token',
	loading: false,
	error: null,
	...overrides,
})

export const createSeriesState = (overrides?: Partial<SeriesState>): SeriesState => ({
	series: [],
	currentSeries: null,
	loading: false,
	error: null,
	pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
	filters: {},
	lastAppliedFilters: null,
	isDataFresh: false,
	...overrides,
})

export const createMoviesState = (overrides?: Partial<MoviesState>): MoviesState => ({
	movies: [],
	currentMovie: null,
	loading: false,
	error: null,
	pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
	filters: {},
	lastAppliedFilters: null,
	isDataFresh: false,
	...overrides,
})

export const createProfileState = (overrides?: Partial<ProfileState>): ProfileState => ({
	currentProfile: null,
	activity: [],
	activityPagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
	loading: false,
	error: null,
	...overrides,
})

export const createSettingsState = (overrides?: Partial<SettingsState>): SettingsState => ({
	providers: null,
	propagationRules: [],
	loading: false,
	error: null,
	...overrides,
})

export const createAdminState = (overrides?: Partial<AdminState>): AdminState => ({
	users: [],
	importQueue: [],
	importQueuePagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
	syncJobs: [],
	syncJobsPagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
	webhookLogs: [],
	webhookLogsPagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
	mediaLibrary: [],
	mediaLibraryPagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
	blacklist: [],
	loading: false,
	bulkRefreshing: false,
	error: null,
	...overrides,
})
