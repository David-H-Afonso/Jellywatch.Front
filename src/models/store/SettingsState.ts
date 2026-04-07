import type {
	ProviderSettingsDto,
	PropagationRuleDto,
	SyncJobDto,
	WebhookEventLogDto,
	ImportQueueItemDto,
	MediaLibraryItemDto,
	BlacklistedItemDto,
	UserDto,
} from '../api'

export interface SettingsState {
	providers: ProviderSettingsDto | null
	propagationRules: PropagationRuleDto[]
	loading: boolean
	error: string | null
}

export interface PaginationMeta {
	page: number
	pageSize: number
	totalCount: number
	totalPages: number
}

export interface AdminState {
	users: UserDto[]
	importQueue: ImportQueueItemDto[]
	importQueuePagination: PaginationMeta
	syncJobs: SyncJobDto[]
	syncJobsPagination: PaginationMeta
	webhookLogs: WebhookEventLogDto[]
	webhookLogsPagination: PaginationMeta
	mediaLibrary: MediaLibraryItemDto[]
	mediaLibraryPagination: PaginationMeta
	blacklist: BlacklistedItemDto[]
	loading: boolean
	bulkRefreshing: boolean
	error: string | null
}
