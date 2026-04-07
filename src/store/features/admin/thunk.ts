import { createAsyncThunk } from '@reduxjs/toolkit'
import {
	getUsers,
	getImportQueue,
	getSyncJobs,
	getWebhookLogs,
	triggerFullSync,
	triggerProfileSync,
	getMediaLibrary,
	deleteMediaItem,
	getBlacklist,
	addToBlacklist,
	removeFromBlacklist,
	refreshMediaItem,
	refreshAllMetadata,
	refreshAllImages,
} from '@/services/AdminService/AdminService'
import type { AddToBlacklistDto } from '@/models/api'

export const fetchUsers = createAsyncThunk('admin/fetchUsers', async (_, { rejectWithValue }) => {
	try {
		return await getUsers()
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Failed to fetch users'
		return rejectWithValue(message)
	}
})

export const fetchImportQueue = createAsyncThunk(
	'admin/fetchImportQueue',
	async (params: { page?: number; pageSize?: number } = {}, { rejectWithValue }) => {
		try {
			return await getImportQueue(params.page, params.pageSize)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to fetch import queue'
			return rejectWithValue(message)
		}
	}
)

export const fetchSyncJobs = createAsyncThunk(
	'admin/fetchSyncJobs',
	async (params: { page?: number; pageSize?: number } = {}, { rejectWithValue }) => {
		try {
			return await getSyncJobs(params.page, params.pageSize)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to fetch sync jobs'
			return rejectWithValue(message)
		}
	}
)

export const fetchWebhookLogs = createAsyncThunk(
	'admin/fetchWebhookLogs',
	async (params: { page?: number; pageSize?: number } = {}, { rejectWithValue }) => {
		try {
			return await getWebhookLogs(params.page, params.pageSize)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to fetch webhook logs'
			return rejectWithValue(message)
		}
	}
)

export const doTriggerFullSync = createAsyncThunk(
	'admin/triggerFullSync',
	async (_, { rejectWithValue }) => {
		try {
			await triggerFullSync()
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to trigger full sync'
			return rejectWithValue(message)
		}
	}
)

export const doTriggerProfileSync = createAsyncThunk(
	'admin/triggerProfileSync',
	async (profileId: number, { rejectWithValue }) => {
		try {
			await triggerProfileSync(profileId)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to trigger profile sync'
			return rejectWithValue(message)
		}
	}
)

export const fetchMediaLibrary = createAsyncThunk(
	'admin/fetchMediaLibrary',
	async (params: { page?: number; pageSize?: number } = {}, { rejectWithValue }) => {
		try {
			return await getMediaLibrary(params.page, params.pageSize)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to fetch media library'
			return rejectWithValue(message)
		}
	}
)

export const doDeleteMediaItem = createAsyncThunk(
	'admin/deleteMediaItem',
	async (id: number, { rejectWithValue }) => {
		try {
			await deleteMediaItem(id)
			return id
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to delete media item'
			return rejectWithValue(message)
		}
	}
)

export const fetchBlacklist = createAsyncThunk(
	'admin/fetchBlacklist',
	async (_, { rejectWithValue }) => {
		try {
			return await getBlacklist()
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to fetch blacklist'
			return rejectWithValue(message)
		}
	}
)

export const doAddToBlacklist = createAsyncThunk(
	'admin/addToBlacklist',
	async (dto: AddToBlacklistDto, { rejectWithValue }) => {
		try {
			return await addToBlacklist(dto)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to add to blacklist'
			return rejectWithValue(message)
		}
	}
)

export const doRemoveFromBlacklist = createAsyncThunk(
	'admin/removeFromBlacklist',
	async (id: number, { rejectWithValue }) => {
		try {
			await removeFromBlacklist(id)
			return id
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to remove from blacklist'
			return rejectWithValue(message)
		}
	}
)

export const doRefreshMediaItem = createAsyncThunk(
	'admin/refreshMediaItem',
	async ({ id, forceTmdbId }: { id: number; forceTmdbId?: number }, { rejectWithValue }) => {
		try {
			await refreshMediaItem(id, forceTmdbId)
			return id
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to refresh media item'
			return rejectWithValue(message)
		}
	}
)

export const doRefreshAllMetadata = createAsyncThunk(
	'admin/refreshAllMetadata',
	async (_, { rejectWithValue }) => {
		try {
			return await refreshAllMetadata()
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to refresh all metadata'
			return rejectWithValue(message)
		}
	}
)

export const doRefreshAllImages = createAsyncThunk(
	'admin/refreshAllImages',
	async (_, { rejectWithValue }) => {
		try {
			return await refreshAllImages()
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to refresh all images'
			return rejectWithValue(message)
		}
	}
)
