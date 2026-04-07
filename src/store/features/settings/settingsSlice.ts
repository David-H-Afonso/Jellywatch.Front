import { createSlice } from '@reduxjs/toolkit'
import type { SettingsState } from '@/models/store/SettingsState'
import {
	fetchProviderSettings,
	fetchPropagationRules,
	addPropagationRule,
	editPropagationRule,
	removePropagationRule,
} from './thunk'

const initialState: SettingsState = {
	providers: null,
	propagationRules: [],
	loading: false,
	error: null,
}

const settingsSlice = createSlice({
	name: 'settings',
	initialState,
	reducers: {
		clearSettingsError: (state) => {
			state.error = null
		},
		resetSettings: () => initialState,
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProviderSettings.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchProviderSettings.fulfilled, (state, action) => {
				state.loading = false
				state.providers = action.payload
			})
			.addCase(fetchProviderSettings.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to fetch providers'
			})

		builder
			.addCase(fetchPropagationRules.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(fetchPropagationRules.fulfilled, (state, action) => {
				state.loading = false
				state.propagationRules = action.payload
			})
			.addCase(fetchPropagationRules.rejected, (state, action) => {
				state.loading = false
				state.error = (action.payload as string) || 'Failed to fetch propagation rules'
			})

		builder.addCase(addPropagationRule.fulfilled, (state, action) => {
			state.propagationRules.push(action.payload)
		})

		builder.addCase(editPropagationRule.fulfilled, (state, action) => {
			const index = state.propagationRules.findIndex((r) => r.id === action.payload.id)
			if (index !== -1) {
				state.propagationRules[index].isActive = action.payload.isActive
			}
		})

		builder.addCase(removePropagationRule.fulfilled, (state, action) => {
			state.propagationRules = state.propagationRules.filter((r) => r.id !== action.payload)
		})
	},
})

export const { clearSettingsError, resetSettings } = settingsSlice.actions
export default settingsSlice.reducer
