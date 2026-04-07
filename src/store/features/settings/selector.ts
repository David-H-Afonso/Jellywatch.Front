import type { RootState } from '@/store'

export const selectProviderSettings = (state: RootState) => state.settings.providers
export const selectPropagationRules = (state: RootState) => state.settings.propagationRules
export const selectSettingsLoading = (state: RootState) => state.settings.loading
export const selectSettingsError = (state: RootState) => state.settings.error
