import { describe, it, expect } from 'vitest'
import profileReducer, { clearProfile } from '@/store/features/profile/profileSlice'
import { fetchProfileDetail, fetchProfileActivity } from '@/store/features/profile/thunk'
import {
	selectCurrentProfile,
	selectProfileActivity,
	selectProfileActivityPagination,
	selectProfileLoading,
	selectProfileError,
} from '@/store/features/profile/selector'
import type { ProfileState } from '@/models/store/ProfileState'

const initial: ProfileState = {
	currentProfile: null,
	activity: [],
	activityPagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
	loading: false,
	error: null,
}

describe('profileSlice – reducers', () => {
	it('returns initial state', () => {
		expect(profileReducer(undefined, { type: 'unknown' })).toEqual(initial)
	})

	it('clearProfile resets state', () => {
		const prev: ProfileState = {
			...initial,
			currentProfile: { id: 1 } as any,
			loading: true,
		}
		expect(profileReducer(prev, clearProfile())).toEqual(initial)
	})
})

describe('profileSlice – thunk extra reducers', () => {
	it('fetchProfileDetail.pending sets loading', () => {
		const state = profileReducer(initial, { type: fetchProfileDetail.pending.type })
		expect(state.loading).toBe(true)
	})

	it('fetchProfileDetail.fulfilled sets currentProfile', () => {
		const profile = { id: 1, displayName: 'Test' }
		const state = profileReducer(initial, {
			type: fetchProfileDetail.fulfilled.type,
			payload: profile,
		})
		expect(state.currentProfile).toEqual(profile)
		expect(state.loading).toBe(false)
	})

	it('fetchProfileDetail.rejected sets error', () => {
		const state = profileReducer(initial, {
			type: fetchProfileDetail.rejected.type,
			payload: 'Failed',
		})
		expect(state.error).toBe('Failed')
	})

	it('fetchProfileActivity.pending sets loading', () => {
		const state = profileReducer(initial, { type: fetchProfileActivity.pending.type })
		expect(state.loading).toBe(true)
	})

	it('fetchProfileActivity.fulfilled sets activity and pagination', () => {
		const payload = {
			data: [{ id: 1, type: 'watch' }],
			page: 1,
			pageSize: 20,
			totalCount: 5,
			totalPages: 1,
		}
		const state = profileReducer(initial, {
			type: fetchProfileActivity.fulfilled.type,
			payload,
		})
		expect(state.activity).toEqual([{ id: 1, type: 'watch' }])
		expect(state.activityPagination.totalCount).toBe(5)
	})

	it('fetchProfileActivity.rejected sets error', () => {
		const state = profileReducer(initial, {
			type: fetchProfileActivity.rejected.type,
			payload: 'Fail',
		})
		expect(state.error).toBe('Fail')
	})
})

describe('profile selectors', () => {
	const root = {
		profile: {
			currentProfile: { id: 1 },
			activity: [{ id: 10 }],
			activityPagination: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
			loading: false,
			error: null,
		},
	} as any

	it('selectCurrentProfile', () => expect(selectCurrentProfile(root)).toEqual({ id: 1 }))
	it('selectProfileActivity', () => expect(selectProfileActivity(root)).toHaveLength(1))
	it('selectProfileActivityPagination', () =>
		expect(selectProfileActivityPagination(root).totalCount).toBe(1))
	it('selectProfileLoading', () => expect(selectProfileLoading(root)).toBe(false))
	it('selectProfileError', () => expect(selectProfileError(root)).toBeNull())
})

describe('profileSlice – edge cases', () => {
	it('fetchProfileDetail.fulfilled does not clear error (only pending does)', () => {
		const prev = { ...initial, error: 'old' }
		const state = profileReducer(prev, {
			type: fetchProfileDetail.fulfilled.type,
			payload: { id: 1, displayName: 'T' },
		})
		expect(state.error).toBe('old')
		expect(state.loading).toBe(false)
	})

	it('fetchProfileDetail.rejected clears loading', () => {
		const state = profileReducer(
			{ ...initial, loading: true },
			{
				type: fetchProfileDetail.rejected.type,
				payload: 'Failed',
			}
		)
		expect(state.loading).toBe(false)
	})

	it('fetchProfileActivity.fulfilled clears loading', () => {
		const payload = { data: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 }
		const state = profileReducer(
			{ ...initial, loading: true },
			{
				type: fetchProfileActivity.fulfilled.type,
				payload,
			}
		)
		expect(state.loading).toBe(false)
	})

	it('clearProfile resets all fields to initial', () => {
		const prev: ProfileState = {
			currentProfile: { id: 5 } as any,
			activity: [{ id: 1 }] as any,
			activityPagination: { page: 3, pageSize: 20, totalCount: 50, totalPages: 3 },
			loading: true,
			error: 'err',
		}
		const state = profileReducer(prev, clearProfile())
		expect(state).toEqual(initial)
	})

	it('selectCurrentProfile returns null when empty', () => {
		const s = { profile: initial } as any
		expect(selectCurrentProfile(s)).toBeNull()
	})

	it('selectProfileActivity returns empty array initially', () => {
		const s = { profile: initial } as any
		expect(selectProfileActivity(s)).toEqual([])
	})

	it('selectProfileActivityPagination returns defaults initially', () => {
		const s = { profile: initial } as any
		expect(selectProfileActivityPagination(s).page).toBe(1)
		expect(selectProfileActivityPagination(s).totalCount).toBe(0)
	})
})
