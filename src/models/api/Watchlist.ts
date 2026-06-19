import type {
	MediaType,
	WatchlistAccessRequestStatus,
	WatchlistInvitationStatus,
	WatchlistItemType,
	WatchlistRole,
	WatchlistState,
	WatchlistStatus,
} from './Enums'

export interface WatchlistIndexDto {
	watchlists: WatchlistSummaryDto[]
	pendingInvitations: WatchlistInvitationDto[]
	incomingAccessRequests: WatchlistAccessRequestDto[]
	defaultWatchlistId: number | null
}

export interface WatchlistSummaryDto {
	id: number
	name: string
	description: string | null
	coverUrl: string | null
	state: WatchlistState
	ownerUserId: number
	ownerUsername: string
	role: WatchlistRole
	permissions: WatchlistPermissionsDto
	itemCount: number
	createdAt: string
	updatedAt: string
}

export interface WatchlistDetailDto extends WatchlistSummaryDto {
	members: WatchlistMemberDto[]
	items: WatchlistItemDto[]
}

export interface WatchlistPermissionsDto {
	canAddItems: boolean
	canRemoveItems: boolean
	canReorderItems: boolean
	canUpdateItemStatus: boolean
	canInviteMembers: boolean
	canManageMembers: boolean
	canUpdateWatchlist: boolean
	canDeleteWatchlist: boolean
}

export interface WatchlistMemberDto {
	id: number
	userId: number
	username: string
	role: WatchlistRole
	permissions: WatchlistPermissionsDto
	createdAt: string
}

export interface WatchlistUserOptionDto {
	id: number
	username: string
	isMember: boolean
	hasPendingInvitation: boolean
}

export interface WatchlistItemDto {
	id: number
	itemType: WatchlistItemType
	mediaItemId: number | null
	childWatchlistId: number | null
	status: WatchlistStatus
	position: number
	addedByUserId: number | null
	addedByUsername: string | null
	createdAt: string
	updatedAt: string
	media: WatchlistMediaItemDto | null
	childWatchlist: WatchlistChildDto | null
}

export interface WatchlistMediaItemDto {
	mediaItemId: number
	mediaType: MediaType
	seriesId: number | null
	movieId: number | null
	title: string
	originalTitle: string | null
	posterPath: string | null
	releaseDate: string | null
	isInProfile: boolean
	isBlacklisted: boolean
	canAddToProfile: boolean
}

export interface WatchlistChildDto {
	id: number
	name: string
	description: string | null
	state: WatchlistState
	hasFullAccess: boolean
	canRequestAccess: boolean
	items: WatchlistItemDto[]
}

export interface WatchlistInvitationDto {
	id: number
	watchlistId: number
	watchlistName: string
	watchlistDescription: string | null
	invitedByUserId: number
	invitedByUsername: string
	role: WatchlistRole
	status: WatchlistInvitationStatus
	createdAt: string
	preview: WatchlistChildDto | null
}

export interface WatchlistAccessRequestDto {
	id: number
	watchlistId: number
	watchlistName: string
	requestingUserId: number
	requestingUsername: string
	status: WatchlistAccessRequestStatus
	createdAt: string
}

export interface CreateWatchlistDto {
	name: string
	description?: string | null
	state?: WatchlistState
	initialItem?: AddWatchlistItemDto | null
}

export interface UpdateWatchlistDto {
	name: string
	description?: string | null
	state: WatchlistState
}

export interface AddWatchlistItemDto {
	itemType: WatchlistItemType
	mediaItemId?: number | null
	childWatchlistId?: number | null
	status: WatchlistStatus
	position?: number | null
}

export interface UpdateWatchlistItemDto {
	status: WatchlistStatus
	position?: number | null
}

export interface InviteWatchlistMemberDto {
	userId?: number | null
	username?: string | null
	role: WatchlistRole
	permissions?: WatchlistPermissionsDto | null
	message?: string | null
}

// ━━━━ IMPORT / EXPORT ━━━━

export interface WatchlistExportDto {
	name: string
	description: string | null
	state: string
	exportedAt: string
	items: WatchlistExportItemDto[]
}

export interface WatchlistExportItemDto {
	mediaType: string
	title: string
	tmdbId: number | null
	imdbId: string | null
	status: string
	position: number
}

export interface WatchlistImportDto {
	name: string
	description?: string | null
	state?: string | null
	items: WatchlistImportItemDto[]
}

export interface WatchlistImportItemDto {
	mediaType: string
	title: string
	tmdbId?: number | null
	imdbId?: string | null
	status?: string | null
	position?: number | null
}

export interface WatchlistImportResultDto {
	watchlistId: number
	watchlistName: string
	totalItems: number
	importedItems: number
	skippedItems: number
	errors: string[]
}
