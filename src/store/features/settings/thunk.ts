import { createAsyncThunk } from '@reduxjs/toolkit'
import {
	getProviderSettings,
	getPropagationRules,
	createPropagationRule,
	updatePropagationRule,
	deletePropagationRule,
} from '@/services/SettingsService/SettingsService'
import type { PropagationRuleCreateDto } from '@/models/api'

export const fetchProviderSettings = createAsyncThunk(
	'settings/fetchProviderSettings',
	async (_, { rejectWithValue }) => {
		try {
			return await getProviderSettings()
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to fetch provider settings'
			return rejectWithValue(message)
		}
	}
)

export const fetchPropagationRules = createAsyncThunk(
	'settings/fetchPropagationRules',
	async (_, { rejectWithValue }) => {
		try {
			return await getPropagationRules()
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to fetch propagation rules'
			return rejectWithValue(message)
		}
	}
)

export const addPropagationRule = createAsyncThunk(
	'settings/addPropagationRule',
	async (data: PropagationRuleCreateDto, { rejectWithValue }) => {
		try {
			return await createPropagationRule(data)
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to create propagation rule'
			return rejectWithValue(message)
		}
	}
)

export const editPropagationRule = createAsyncThunk(
	'settings/editPropagationRule',
	async ({ id, isActive }: { id: number; isActive: boolean }, { rejectWithValue }) => {
		try {
			await updatePropagationRule(id, isActive)
			return { id, isActive }
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to update propagation rule'
			return rejectWithValue(message)
		}
	}
)

export const removePropagationRule = createAsyncThunk(
	'settings/removePropagationRule',
	async (id: number, { rejectWithValue }) => {
		try {
			await deletePropagationRule(id)
			return id
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to delete propagation rule'
			return rejectWithValue(message)
		}
	}
)
