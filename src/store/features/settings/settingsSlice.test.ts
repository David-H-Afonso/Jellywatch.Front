import { describe, it, expect } from 'vitest'
import settingsReducer, {
	clearSettingsError,
	resetSettings,
} from '@/store/features/settings/settingsSlice'
import {
	fetchProviderSettings,
	fetchPropagationRules,
	addPropagationRule,
	editPropagationRule,
	removePropagationRule,
} from '@/store/features/settings/thunk'
import {
	selectProviderSettings,
	selectPropagationRules,
	selectSettingsLoading,
	selectSettingsError,
} from '@/store/features/settings/selector'
import type { SettingsState } from '@/models/store/SettingsState'
import { createPropagationRuleDto } from '@/test/factories'

const initial: SettingsState = {
	providers: null,
	propagationRules: [],
	loading: false,
	error: null,
}

describe('settingsSlice – reducers', () => {
	it('returns initial state', () => {
		expect(settingsReducer(undefined, { type: 'unknown' })).toEqual(initial)
	})

	it('clearSettingsError clears error', () => {
		const state = settingsReducer({ ...initial, error: 'oops' }, clearSettingsError())
		expect(state.error).toBeNull()
	})

	it('resetSettings returns initial', () => {
		const prev: SettingsState = { ...initial, loading: true, error: 'x' }
		expect(settingsReducer(prev, resetSettings())).toEqual(initial)
	})
})

describe('settingsSlice – provider thunks', () => {
	it('fetchProviderSettings.pending sets loading', () => {
		const state = settingsReducer(initial, { type: fetchProviderSettings.pending.type })
		expect(state.loading).toBe(true)
	})

	it('fetchProviderSettings.fulfilled sets providers', () => {
		const providers = { jellyfin: { url: 'http://jf' } }
		const state = settingsReducer(initial, {
			type: fetchProviderSettings.fulfilled.type,
			payload: providers,
		})
		expect(state.providers).toEqual(providers)
		expect(state.loading).toBe(false)
	})

	it('fetchProviderSettings.rejected sets error', () => {
		const state = settingsReducer(initial, {
			type: fetchProviderSettings.rejected.type,
			payload: 'Fail',
		})
		expect(state.error).toBe('Fail')
	})
})

describe('settingsSlice – propagation rule thunks', () => {
	it('fetchPropagationRules.fulfilled sets rules', () => {
		const rules = [createPropagationRuleDto({ id: 1 })]
		const state = settingsReducer(initial, {
			type: fetchPropagationRules.fulfilled.type,
			payload: rules,
		})
		expect(state.propagationRules).toHaveLength(1)
	})

	it('addPropagationRule.fulfilled appends rule', () => {
		const prev: SettingsState = {
			...initial,
			propagationRules: [createPropagationRuleDto({ id: 1 })],
		}
		const newRule = createPropagationRuleDto({ id: 2 })
		const state = settingsReducer(prev, {
			type: addPropagationRule.fulfilled.type,
			payload: newRule,
		})
		expect(state.propagationRules).toHaveLength(2)
	})

	it('editPropagationRule.fulfilled updates isActive', () => {
		const prev: SettingsState = {
			...initial,
			propagationRules: [createPropagationRuleDto({ id: 1, isActive: true })],
		}
		const state = settingsReducer(prev, {
			type: editPropagationRule.fulfilled.type,
			payload: { id: 1, isActive: false },
		})
		expect(state.propagationRules[0].isActive).toBe(false)
	})

	it('removePropagationRule.fulfilled removes rule by id', () => {
		const prev: SettingsState = {
			...initial,
			propagationRules: [createPropagationRuleDto({ id: 1 }), createPropagationRuleDto({ id: 2 })],
		}
		const state = settingsReducer(prev, {
			type: removePropagationRule.fulfilled.type,
			payload: 1,
		})
		expect(state.propagationRules).toHaveLength(1)
		expect(state.propagationRules[0].id).toBe(2)
	})
})

describe('settings selectors', () => {
	const root = {
		settings: {
			providers: { jellyfin: {} },
			propagationRules: [{ id: 1 }],
			loading: true,
			error: 'err',
		},
	} as any

	it('selectProviderSettings', () => expect(selectProviderSettings(root)).toEqual({ jellyfin: {} }))
	it('selectPropagationRules', () => expect(selectPropagationRules(root)).toHaveLength(1))
	it('selectSettingsLoading', () => expect(selectSettingsLoading(root)).toBe(true))
	it('selectSettingsError', () => expect(selectSettingsError(root)).toBe('err'))
})

describe('settingsSlice – thunk pending/rejected edge cases', () => {
	it('fetchPropagationRules.pending sets loading', () => {
		const state = settingsReducer(initial, { type: fetchPropagationRules.pending.type })
		expect(state.loading).toBe(true)
	})

	it('fetchPropagationRules.rejected sets error', () => {
		const state = settingsReducer(initial, {
			type: fetchPropagationRules.rejected.type,
			payload: 'Network error',
		})
		expect(state.error).toBe('Network error')
	})

	it('addPropagationRule.fulfilled adds rule to list', () => {
		const rule = createPropagationRuleDto({ id: 99 })
		const state = settingsReducer(initial, {
			type: addPropagationRule.fulfilled.type,
			payload: rule,
		})
		expect(state.propagationRules).toContainEqual(rule)
	})

	it('editPropagationRule.fulfilled updates rule in list', () => {
		const existing = createPropagationRuleDto({ id: 1, isActive: true })
		const prev: SettingsState = { ...initial, propagationRules: [existing] }
		const state = settingsReducer(prev, {
			type: editPropagationRule.fulfilled.type,
			payload: { id: 1, isActive: false },
		})
		expect(state.propagationRules[0].isActive).toBe(false)
	})

	it('removePropagationRule.fulfilled removes rule from list', () => {
		const existing = createPropagationRuleDto({ id: 1 })
		const prev: SettingsState = { ...initial, propagationRules: [existing] }
		const state = settingsReducer(prev, {
			type: removePropagationRule.fulfilled.type,
			payload: 1,
		})
		expect(state.propagationRules).toHaveLength(0)
	})

	it('unhandled pending actions do not set loading', () => {
		const state = settingsReducer(initial, { type: addPropagationRule.pending.type })
		expect(state.loading).toBe(initial.loading)
	})

	it('unhandled rejected actions do not set error', () => {
		const state = settingsReducer(initial, {
			type: addPropagationRule.rejected.type,
			payload: 'Validation error',
		})
		expect(state.error).toBe(initial.error)
	})

	it('fetchPropagationRules.fulfilled clears loading', () => {
		const state = settingsReducer(
			{ ...initial, loading: true },
			{
				type: fetchPropagationRules.fulfilled.type,
				payload: [],
			}
		)
		expect(state.loading).toBe(false)
	})

	it('resetSettings clears providers', () => {
		const prev: SettingsState = { ...initial, providers: { jellyfin: {} } as any }
		const state = settingsReducer(prev, resetSettings())
		expect(state.providers).toBeNull()
	})

	it('selectProviderSettings returns null initially', () => {
		const s = { settings: initial } as any
		expect(selectProviderSettings(s)).toBeNull()
	})

	it('selectPropagationRules returns empty array initially', () => {
		const s = { settings: initial } as any
		expect(selectPropagationRules(s)).toEqual([])
	})
})
