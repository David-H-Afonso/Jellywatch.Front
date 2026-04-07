import type { RootState } from '@/store'

export const selectAdminUsers = (state: RootState) => state.admin.users
export const selectImportQueue = (state: RootState) => state.admin.importQueue
export const selectImportQueuePagination = (state: RootState) => state.admin.importQueuePagination
export const selectSyncJobs = (state: RootState) => state.admin.syncJobs
export const selectSyncJobsPagination = (state: RootState) => state.admin.syncJobsPagination
export const selectWebhookLogs = (state: RootState) => state.admin.webhookLogs
export const selectWebhookLogsPagination = (state: RootState) => state.admin.webhookLogsPagination
export const selectMediaLibrary = (state: RootState) => state.admin.mediaLibrary
export const selectMediaLibraryPagination = (state: RootState) => state.admin.mediaLibraryPagination
export const selectBlacklist = (state: RootState) => state.admin.blacklist
export const selectAdminLoading = (state: RootState) => state.admin.loading
export const selectBulkRefreshing = (state: RootState) => state.admin.bulkRefreshing
export const selectAdminError = (state: RootState) => state.admin.error
