import { describe, it, expect } from 'vitest'
import adminReducer, { clearAdminError, resetAdmin } from '@/store/features/admin/adminSlice'
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
} from '@/store/features/admin/thunk'
import {
	selectAdminUsers,
	selectImportQueue,
	selectImportQueuePagination,
	selectSyncJobs,
	selectSyncJobsPagination,
	selectWebhookLogs,
	selectWebhookLogsPagination,
	selectMediaLibrary,
	selectMediaLibraryPagination,
	selectBlacklist,
	selectAdminLoading,
	selectBulkRefreshing,
	selectAdminError,
} from '@/store/features/admin/selector'
import type { AdminState } from '@/models/store/SettingsState'
import {
	createUserDto,
	createImportQueueItemDto,
	createSyncJobDto,
	createWebhookLogDto,
	createMediaLibraryItemDto,
	createBlacklistedItemDto,
} from '@/test/factories'

const defPag = { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 }

const initial: AdminState = {
	users: [],
	importQueue: [],
	importQueuePagination: { ...defPag },
	syncJobs: [],
	syncJobsPagination: { ...defPag },
	webhookLogs: [],
	webhookLogsPagination: { ...defPag },
	mediaLibrary: [],
	mediaLibraryPagination: { ...defPag },
	blacklist: [],
	loading: false,
	bulkRefreshing: false,
	error: null,
}

describe('adminSlice – reducers', () => {
	it('returns initial state', () => {
		expect(adminReducer(undefined, { type: 'unknown' })).toEqual(initial)
	})

	it('clearAdminError clears error', () => {
		const state = adminReducer({ ...initial, error: 'err' }, clearAdminError())
		expect(state.error).toBeNull()
	})

	it('resetAdmin returns initial', () => {
		const prev: AdminState = { ...initial, loading: true, error: 'x' }
		expect(adminReducer(prev, resetAdmin())).toEqual(initial)
	})
})

describe('adminSlice – fetchUsers', () => {
	it('pending sets loading', () => {
		const state = adminReducer(initial, { type: fetchUsers.pending.type })
		expect(state.loading).toBe(true)
	})

	it('fulfilled sets users', () => {
		const users = [createUserDto({ id: 1 })]
		const state = adminReducer(initial, {
			type: fetchUsers.fulfilled.type,
			payload: users,
		})
		expect(state.users).toHaveLength(1)
		expect(state.loading).toBe(false)
	})

	it('rejected sets error', () => {
		const state = adminReducer(initial, {
			type: fetchUsers.rejected.type,
			payload: 'Fail',
		})
		expect(state.error).toBe('Fail')
	})
})

describe('adminSlice – fetchImportQueue', () => {
	it('fulfilled sets importQueue and pagination', () => {
		const payload = {
			data: [createImportQueueItemDto()],
			page: 1,
			pageSize: 10,
			totalCount: 1,
			totalPages: 1,
		}
		const state = adminReducer(initial, {
			type: fetchImportQueue.fulfilled.type,
			payload,
		})
		expect(state.importQueue).toHaveLength(1)
		expect(state.importQueuePagination.totalCount).toBe(1)
	})
})

describe('adminSlice – fetchSyncJobs', () => {
	it('fulfilled sets syncJobs', () => {
		const payload = {
			data: [createSyncJobDto()],
			page: 1,
			pageSize: 10,
			totalCount: 1,
			totalPages: 1,
		}
		const state = adminReducer(initial, {
			type: fetchSyncJobs.fulfilled.type,
			payload,
		})
		expect(state.syncJobs).toHaveLength(1)
	})
})

describe('adminSlice – fetchWebhookLogs', () => {
	it('fulfilled sets webhookLogs', () => {
		const payload = {
			data: [createWebhookLogDto()],
			page: 1,
			pageSize: 10,
			totalCount: 1,
			totalPages: 1,
		}
		const state = adminReducer(initial, {
			type: fetchWebhookLogs.fulfilled.type,
			payload,
		})
		expect(state.webhookLogs).toHaveLength(1)
	})
})

describe('adminSlice – fetchMediaLibrary', () => {
	it('fulfilled sets mediaLibrary', () => {
		const payload = {
			data: [createMediaLibraryItemDto({ id: 5 })],
			page: 1,
			pageSize: 10,
			totalCount: 1,
			totalPages: 1,
		}
		const state = adminReducer(initial, {
			type: fetchMediaLibrary.fulfilled.type,
			payload,
		})
		expect(state.mediaLibrary).toHaveLength(1)
		expect(state.mediaLibrary[0].id).toBe(5)
	})
})

describe('adminSlice – doDeleteMediaItem', () => {
	it('fulfilled removes item from mediaLibrary', () => {
		const prev: AdminState = {
			...initial,
			mediaLibrary: [createMediaLibraryItemDto({ id: 1 }), createMediaLibraryItemDto({ id: 2 })],
		}
		const state = adminReducer(prev, {
			type: doDeleteMediaItem.fulfilled.type,
			payload: 1,
		})
		expect(state.mediaLibrary).toHaveLength(1)
		expect(state.mediaLibrary[0].id).toBe(2)
	})

	it('rejected sets error', () => {
		const state = adminReducer(initial, {
			type: doDeleteMediaItem.rejected.type,
			payload: 'Fail',
		})
		expect(state.error).toBe('Fail')
	})
})

describe('adminSlice – doRefreshMediaItem', () => {
	it('rejected sets error', () => {
		const state = adminReducer(initial, {
			type: doRefreshMediaItem.rejected.type,
			payload: 'Fail',
		})
		expect(state.error).toBe('Fail')
	})
})

describe('adminSlice – bulk refresh', () => {
	it('doRefreshAllMetadata.pending sets bulkRefreshing', () => {
		const state = adminReducer(initial, { type: doRefreshAllMetadata.pending.type })
		expect(state.bulkRefreshing).toBe(true)
	})

	it('doRefreshAllMetadata.fulfilled clears bulkRefreshing', () => {
		const state = adminReducer(
			{ ...initial, bulkRefreshing: true },
			{ type: doRefreshAllMetadata.fulfilled.type }
		)
		expect(state.bulkRefreshing).toBe(false)
	})

	it('doRefreshAllMetadata.rejected sets error', () => {
		const state = adminReducer(initial, {
			type: doRefreshAllMetadata.rejected.type,
			payload: 'Fail',
		})
		expect(state.bulkRefreshing).toBe(false)
		expect(state.error).toBe('Fail')
	})

	it('doRefreshAllImages.pending sets bulkRefreshing', () => {
		const state = adminReducer(initial, { type: doRefreshAllImages.pending.type })
		expect(state.bulkRefreshing).toBe(true)
	})

	it('doRefreshAllImages.fulfilled clears bulkRefreshing', () => {
		const state = adminReducer(
			{ ...initial, bulkRefreshing: true },
			{ type: doRefreshAllImages.fulfilled.type }
		)
		expect(state.bulkRefreshing).toBe(false)
	})
})

describe('adminSlice – blacklist', () => {
	it('fetchBlacklist.fulfilled sets blacklist', () => {
		const items = [createBlacklistedItemDto({ id: 1 })]
		const state = adminReducer(initial, {
			type: fetchBlacklist.fulfilled.type,
			payload: items,
		})
		expect(state.blacklist).toHaveLength(1)
	})

	it('doAddToBlacklist.fulfilled prepends item', () => {
		const prev: AdminState = {
			...initial,
			blacklist: [createBlacklistedItemDto({ id: 1 })],
		}
		const newItem = createBlacklistedItemDto({ id: 2 })
		const state = adminReducer(prev, {
			type: doAddToBlacklist.fulfilled.type,
			payload: newItem,
		})
		expect(state.blacklist).toHaveLength(2)
		expect(state.blacklist[0].id).toBe(2) // prepended
	})

	it('doRemoveFromBlacklist.fulfilled removes item', () => {
		const prev: AdminState = {
			...initial,
			blacklist: [createBlacklistedItemDto({ id: 1 }), createBlacklistedItemDto({ id: 2 })],
		}
		const state = adminReducer(prev, {
			type: doRemoveFromBlacklist.fulfilled.type,
			payload: 1,
		})
		expect(state.blacklist).toHaveLength(1)
		expect(state.blacklist[0].id).toBe(2)
	})
})

describe('admin selectors', () => {
	const root = {
		admin: {
			users: [{ id: 1 }],
			importQueue: [{ id: 2 }],
			importQueuePagination: { page: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
			syncJobs: [{ id: 3 }],
			syncJobsPagination: { page: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
			webhookLogs: [{ id: 4 }],
			webhookLogsPagination: { page: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
			mediaLibrary: [{ id: 5 }],
			mediaLibraryPagination: { page: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
			blacklist: [{ id: 6 }],
			loading: true,
			bulkRefreshing: true,
			error: 'err',
		},
	} as any

	it('selectAdminUsers', () => expect(selectAdminUsers(root)).toHaveLength(1))
	it('selectImportQueue', () => expect(selectImportQueue(root)).toHaveLength(1))
	it('selectImportQueuePagination', () =>
		expect(selectImportQueuePagination(root).totalCount).toBe(1))
	it('selectSyncJobs', () => expect(selectSyncJobs(root)).toHaveLength(1))
	it('selectSyncJobsPagination', () => expect(selectSyncJobsPagination(root).totalCount).toBe(1))
	it('selectWebhookLogs', () => expect(selectWebhookLogs(root)).toHaveLength(1))
	it('selectWebhookLogsPagination', () =>
		expect(selectWebhookLogsPagination(root).totalCount).toBe(1))
	it('selectMediaLibrary', () => expect(selectMediaLibrary(root)).toHaveLength(1))
	it('selectMediaLibraryPagination', () =>
		expect(selectMediaLibraryPagination(root).totalCount).toBe(1))
	it('selectBlacklist', () => expect(selectBlacklist(root)).toHaveLength(1))
	it('selectAdminLoading', () => expect(selectAdminLoading(root)).toBe(true))
	it('selectBulkRefreshing', () => expect(selectBulkRefreshing(root)).toBe(true))
	it('selectAdminError', () => expect(selectAdminError(root)).toBe('err'))
})

describe('adminSlice – pending/rejected edge cases', () => {
	it('fetchImportQueue.pending sets loading', () => {
		const state = adminReducer(initial, { type: fetchImportQueue.pending.type })
		expect(state.loading).toBe(true)
	})

	it('fetchImportQueue.rejected sets error', () => {
		const state = adminReducer(initial, {
			type: fetchImportQueue.rejected.type,
			payload: 'Queue error',
		})
		expect(state.error).toBe('Queue error')
	})

	it('fetchSyncJobs.pending sets loading', () => {
		const state = adminReducer(initial, { type: fetchSyncJobs.pending.type })
		expect(state.loading).toBe(true)
	})

	it('fetchSyncJobs.rejected sets error', () => {
		const state = adminReducer(initial, {
			type: fetchSyncJobs.rejected.type,
			payload: 'Sync error',
		})
		expect(state.error).toBe('Sync error')
	})

	it('fetchWebhookLogs.pending sets loading', () => {
		const state = adminReducer(initial, { type: fetchWebhookLogs.pending.type })
		expect(state.loading).toBe(true)
	})

	it('fetchWebhookLogs.rejected sets error', () => {
		const state = adminReducer(initial, {
			type: fetchWebhookLogs.rejected.type,
			payload: 'Log error',
		})
		expect(state.error).toBe('Log error')
	})

	it('fetchMediaLibrary.pending sets loading', () => {
		const state = adminReducer(initial, { type: fetchMediaLibrary.pending.type })
		expect(state.loading).toBe(true)
	})

	it('fetchMediaLibrary.rejected sets error', () => {
		const state = adminReducer(initial, {
			type: fetchMediaLibrary.rejected.type,
			payload: 'Media error',
		})
		expect(state.error).toBe('Media error')
	})

	it('fetchBlacklist actions do not set loading (not handled)', () => {
		const state = adminReducer(initial, { type: fetchBlacklist.pending.type })
		expect(state.loading).toBe(initial.loading)
	})

	it('fetchBlacklist.rejected sets error', () => {
		const state = adminReducer(initial, {
			type: fetchBlacklist.rejected.type,
			payload: 'Blacklist error',
		})
		expect(state.error).toBe('Blacklist error')
	})

	it('doAddToBlacklist.rejected sets error', () => {
		const state = adminReducer(initial, {
			type: doAddToBlacklist.rejected.type,
			payload: 'Add failed',
		})
		expect(state.error).toBe('Add failed')
	})

	it('doRemoveFromBlacklist.rejected sets error', () => {
		const state = adminReducer(initial, {
			type: doRemoveFromBlacklist.rejected.type,
			payload: 'Remove failed',
		})
		expect(state.error).toBe('Remove failed')
	})

	it('doDeleteMediaItem actions do not set loading (not handled)', () => {
		const state = adminReducer(initial, { type: doDeleteMediaItem.pending.type })
		expect(state.loading).toBe(initial.loading)
	})

	it('doRefreshAllImages.rejected sets error and clears bulkRefreshing', () => {
		const state = adminReducer(
			{ ...initial, bulkRefreshing: true },
			{
				type: doRefreshAllImages.rejected.type,
				payload: 'Refresh error',
			}
		)
		expect(state.bulkRefreshing).toBe(false)
		expect(state.error).toBe('Refresh error')
	})

	it('clearAdminError preserves data', () => {
		const prev: AdminState = {
			...initial,
			users: [createUserDto({ id: 1 })],
			error: 'err',
		}
		const state = adminReducer(prev, clearAdminError())
		expect(state.error).toBeNull()
		expect(state.users).toHaveLength(1)
	})

	it('resetAdmin clears all arrays', () => {
		const prev: AdminState = {
			...initial,
			users: [createUserDto({ id: 1 })],
			blacklist: [createBlacklistedItemDto({ id: 1 })],
		}
		const state = adminReducer(prev, resetAdmin())
		expect(state.users).toEqual([])
		expect(state.blacklist).toEqual([])
	})
})
