import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import type { ReactNode } from 'react'
import { useAppDispatch, useAppSelector } from './hooks'
import { createTestStore } from '@/test/utils/createTestStore'

function wrapper({ children }: { children: ReactNode }) {
	return <Provider store={createTestStore()}>{children}</Provider>
}

describe('useAppDispatch', () => {
	it('returns a dispatch function', () => {
		const { result } = renderHook(() => useAppDispatch(), { wrapper })
		expect(typeof result.current).toBe('function')
	})

	it('can dispatch an action', () => {
		const { result } = renderHook(() => useAppDispatch(), { wrapper })
		expect(() => result.current({ type: 'test/action' })).not.toThrow()
	})
})

describe('useAppSelector', () => {
	it('selects state from the store', () => {
		const { result } = renderHook(() => useAppSelector((state) => state.auth), { wrapper })
		expect(result.current).toBeDefined()
		expect(result.current).toHaveProperty('isAuthenticated')
	})

	it('returns the correct initial auth state', () => {
		const { result } = renderHook(() => useAppSelector((state) => state.auth.isAuthenticated), {
			wrapper,
		})
		expect(result.current).toBe(false)
	})
})
