import { createSlice } from '@reduxjs/toolkit'
import type { AdminState } from '@/models/store/SettingsState'
import type {
	ImportQueueItemDto,
	SyncJobDto,
	WebhookEventLogDto,
	MediaLibraryItemDto,
} from '@/models/api'
import {
	fetchUsers,
	fetchImportQueue,
	fetchSyncJobs,
	fetchWebhookLogs,
	fetchMediaLibrary,
	doDeleteMediaItem,
	doRefreshMediaItem,
	doRefreshAllMetadata,
	doRefreshAllImages,
	fetchBlacklist,
	doAddToBlacklist,
	doRemoveFromBlacklist,
} from './thunk'

const defaultPagination = { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 }

const initialState: AdminState = {
	users: [],
	importQueue: [],
	importQueuePagination: { ...defaultPagination },
	syncJobs: [],
	syncJobsPagination: { ...defaultPagination },
	webhookLogs: [],
	webhookLogsPagination: { ...defaultPagination },
	mediaLibrary: [],
	mediaLibraryPagination: { ...defaultPagination },
	blacklist: [],
	loading: false,
	bulkRefreshing: false,
	error: null,
}

const adminSlice = createSlice({
	name: 'admin',
	initialState,
	reducers: {
		clearAdminError: (state) => {
			state.error = null
		},
		resetAdmin: () => initialState,
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchUsers.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchUsers.fulfilled, (state, action) => {
				state.loading = false
				state.users = action.payload
			})
			.addCase(fetchUsers.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to fetch users'
			})

		builder
			.addCase(fetchImportQueue.pending, (state) => {
				state.loading = true
			})
			.addCase(fetchImportQueue.fulfilled, (state, action) => {
				state.loading = false
				state.importQueue = action.payload.data as ImportQueueItemDto[]
				state.importQueuePagination = {
					page: action.payload.page,
					pageSize: action.payload.pageSize,
					totalCount: action.payload.totalCount,
					totalPages: action.payload.totalPages,
				}
			})
			.addCase(fetchImportQueue.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to fetch import queue'
			})

		builder
			.addCase(fetchSyncJobs.pending, (state) => {
				state.loading = true
			})
			.addCase(fetchSyncJobs.fulfilled, (state, action) => {
				state.loading = false
				state.syncJobs = action.payload.data as SyncJobDto[]
				state.syncJobsPagination = {
					page: action.payload.page,
					pageSize: action.payload.pageSize,
					totalCount: action.payload.totalCount,
					totalPages: action.payload.totalPages,
				}
			})
			.addCase(fetchSyncJobs.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to fetch sync jobs'
			})

		builder
			.addCase(fetchWebhookLogs.pending, (state) => {
				state.loading = true
			})
			.addCase(fetchWebhookLogs.fulfilled, (state, action) => {
				state.loading = false
				state.webhookLogs = action.payload.data as WebhookEventLogDto[]
				state.webhookLogsPagination = {
					page: action.payload.page,
					pageSize: action.payload.pageSize,
					totalCount: action.payload.totalCount,
					totalPages: action.payload.totalPages,
				}
			})
			.addCase(fetchWebhookLogs.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to fetch webhook logs'
			})

		builder
			.addCase(fetchMediaLibrary.pending, (state) => {
				state.loading = true
			})
			.addCase(fetchMediaLibrary.fulfilled, (state, action) => {
				state.loading = false
				state.mediaLibrary = action.payload.data as MediaLibraryItemDto[]
				state.mediaLibraryPagination = {
					page: action.payload.page,
					pageSize: action.payload.pageSize,
					totalCount: action.payload.totalCount,
					totalPages: action.payload.totalPages,
				}
			})
			.addCase(fetchMediaLibrary.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to fetch media library'
			})

		builder
			.addCase(doDeleteMediaItem.fulfilled, (state, action) => {
				state.mediaLibrary = state.mediaLibrary.filter((m) => m.id !== action.payload)
			})
			.addCase(doDeleteMediaItem.rejected, (state, action) => {
				state.error = (action.payload as string) || 'Failed to delete media item'
			})

		builder.addCase(doRefreshMediaItem.rejected, (state, action) => {
			state.error = (action.payload as string) || 'Failed to refresh media item'
		})

		builder
			.addCase(doRefreshAllMetadata.pending, (state) => {
				state.bulkRefreshing = true
				state.error = null
			})
			.addCase(doRefreshAllMetadata.fulfilled, (state) => {
				state.bulkRefreshing = false
			})
			.addCase(doRefreshAllMetadata.rejected, (state, action) => {
				state.bulkRefreshing = false
				state.error = (action.payload as string) || 'Failed to refresh all metadata'
			})

		builder
			.addCase(doRefreshAllImages.pending, (state) => {
				state.bulkRefreshing = true
				state.error = null
			})
			.addCase(doRefreshAllImages.fulfilled, (state) => {
				state.bulkRefreshing = false
			})
			.addCase(doRefreshAllImages.rejected, (state, action) => {
				state.bulkRefreshing = false
				state.error = (action.payload as string) || 'Failed to refresh all images'
			})

		builder
			.addCase(fetchBlacklist.fulfilled, (state, action) => {
				state.blacklist = action.payload
			})
			.addCase(fetchBlacklist.rejected, (state, action) => {
				state.error = (action.payload as string) || 'Failed to fetch blacklist'
			})

		builder
			.addCase(doAddToBlacklist.fulfilled, (state, action) => {
				state.blacklist.unshift(action.payload)
			})
			.addCase(doAddToBlacklist.rejected, (state, action) => {
				state.error = (action.payload as string) || 'Failed to add to blacklist'
			})

		builder
			.addCase(doRemoveFromBlacklist.fulfilled, (state, action) => {
				state.blacklist = state.blacklist.filter((b) => b.id !== action.payload)
			})
			.addCase(doRemoveFromBlacklist.rejected, (state, action) => {
				state.error = (action.payload as string) || 'Failed to remove from blacklist'
			})
	},
})

export const { clearAdminError, resetAdmin } = adminSlice.actions
export default adminSlice.reducer
