import { describe, it, expect, vi } from 'vitest'
import authReducer, {
	clearError,
	forceLogout,
	setActiveProfile,
	loginUser,
	logoutUser,
	fetchCurrentUser,
} from '@/store/features/auth/authSlice'
import {
	selectAuth,
	selectIsAuthenticated,
	selectCurrentUser,
	selectIsAdmin,
	selectAuthLoading,
	selectAuthError,
	selectAuthToken,
	selectActiveProfileId,
	selectProfiles,
} from '@/store/features/auth/selector'
import type { AuthState } from '@/models/store/AuthState'
import { createAuthState } from '@/test/factories'

vi.mock('@/services', () => ({
	authService: {
		login: vi.fn(),
		logout: vi.fn(),
	},
	userService: {
		getMe: vi.fn(),
	},
}))

vi.mock('@/navigation/router', () => ({
	router: { navigate: vi.fn() },
}))

const initial: AuthState = {
	isAuthenticated: false,
	user: null,
	token: null,
	loading: false,
	error: null,
}

describe('authSlice – reducers', () => {
	it('returns initial state', () => {
		const state = authReducer(undefined, { type: 'unknown' })
		expect(state).toEqual(initial)
	})

	it('clearError sets error to null', () => {
		const state = authReducer({ ...initial, error: 'fail' }, clearError())
		expect(state.error).toBeNull()
	})

	it('forceLogout resets auth state', () => {
		const state = authReducer(
			createAuthState({ isAuthenticated: true, token: 'tok' }),
			forceLogout()
		)
		expect(state.isAuthenticated).toBe(false)
		expect(state.token).toBeNull()
		expect(state.user).toBeNull()
	})

	it('setActiveProfile updates activeProfileId', () => {
		const prev = createAuthState({
			user: {
				id: 1,
				username: 'u',
				isAdmin: false,
				avatarUrl: null,
				preferredLanguage: 'en',
				jellyfinUserId: 'j1',
				profiles: [{ id: 10, displayName: 'A', jellyfinUserId: 'j1', isJoint: false }],
				activeProfileId: null,
			},
		})
		const state = authReducer(prev, setActiveProfile(10))
		expect(state.user?.activeProfileId).toBe(10)
	})

	it('setActiveProfile does nothing when user is null', () => {
		const state = authReducer(initial, setActiveProfile(10))
		expect(state.user).toBeNull()
	})
})

describe('authSlice – loginUser thunk', () => {
	it('pending sets loading=true, error=null', () => {
		const state = authReducer({ ...initial, error: 'old' }, { type: loginUser.pending.type })
		expect(state.loading).toBe(true)
		expect(state.error).toBeNull()
	})

	it('fulfilled sets isAuthenticated=true and token', () => {
		const state = authReducer(initial, {
			type: loginUser.fulfilled.type,
			payload: { token: 'jwt-123' },
		})
		expect(state.isAuthenticated).toBe(true)
		expect(state.token).toBe('jwt-123')
		expect(state.loading).toBe(false)
	})

	it('rejected clears auth and sets error', () => {
		const state = authReducer(createAuthState({ isAuthenticated: true, token: 'tok' }), {
			type: loginUser.rejected.type,
			payload: 'Bad credentials',
		})
		expect(state.isAuthenticated).toBe(false)
		expect(state.token).toBeNull()
		expect(state.user).toBeNull()
		expect(state.error).toBe('Bad credentials')
	})
})

describe('authSlice – logoutUser thunk', () => {
	it('fulfilled resets state', () => {
		const state = authReducer(createAuthState({ isAuthenticated: true, token: 'tok' }), {
			type: logoutUser.fulfilled.type,
		})
		expect(state.isAuthenticated).toBe(false)
		expect(state.token).toBeNull()
		expect(state.user).toBeNull()
	})
})

describe('authSlice – fetchCurrentUser thunk', () => {
	it('fulfilled populates user from API response', () => {
		const me = {
			id: 1,
			username: 'admin',
			isAdmin: true,
			avatarUrl: '/img.png',
			preferredLanguage: 'es',
			jellyfinUserId: 'jf1',
			profiles: [
				{ id: 10, displayName: 'Main', jellyfinUserId: 'jf1', isJoint: false },
				{ id: 11, displayName: 'Joint', jellyfinUserId: 'jf2', isJoint: true },
			],
		}

		const state = authReducer(initial, {
			type: fetchCurrentUser.fulfilled.type,
			payload: me,
		})

		expect(state.user?.username).toBe('admin')
		expect(state.user?.isAdmin).toBe(true)
		expect(state.user?.profiles).toHaveLength(2)
		expect(state.user?.activeProfileId).toBe(10) // first profile
	})

	it('preserves existing activeProfileId when user already has one', () => {
		const prev = createAuthState({
			user: {
				id: 1,
				username: 'u',
				isAdmin: false,
				avatarUrl: null,
				preferredLanguage: 'en',
				jellyfinUserId: 'j1',
				profiles: [],
				activeProfileId: 99,
			},
		})

		const me = {
			id: 1,
			username: 'u',
			isAdmin: false,
			avatarUrl: null,
			preferredLanguage: 'en',
			jellyfinUserId: 'j1',
			profiles: [{ id: 10, displayName: 'A', jellyfinUserId: 'j1', isJoint: false }],
		}

		const state = authReducer(prev, {
			type: fetchCurrentUser.fulfilled.type,
			payload: me,
		})
		expect(state.user?.activeProfileId).toBe(99)
	})
})

describe('auth selectors', () => {
	const user = {
		id: 1,
		username: 'admin',
		isAdmin: true,
		avatarUrl: null,
		preferredLanguage: 'en',
		jellyfinUserId: 'j1',
		profiles: [{ id: 10, displayName: 'A', jellyfinUserId: 'j1', isJoint: false }],
		activeProfileId: 10,
	}

	const root = {
		auth: { isAuthenticated: true, user, token: 'tok', loading: false, error: null },
	} as any

	it('selectAuth', () => expect(selectAuth(root)).toBe(root.auth))
	it('selectIsAuthenticated', () => expect(selectIsAuthenticated(root)).toBe(true))
	it('selectCurrentUser', () => expect(selectCurrentUser(root)).toBe(user))
	it('selectIsAdmin', () => expect(selectIsAdmin(root)).toBe(true))
	it('selectAuthLoading', () => expect(selectAuthLoading(root)).toBe(false))
	it('selectAuthError', () => expect(selectAuthError(root)).toBeNull())
	it('selectAuthToken', () => expect(selectAuthToken(root)).toBe('tok'))
	it('selectActiveProfileId', () => expect(selectActiveProfileId(root)).toBe(10))
	it('selectProfiles', () => expect(selectProfiles(root)).toHaveLength(1))

	it('selectIsAuthenticated is false when token is null', () => {
		const s = { auth: { ...root.auth, token: null } } as any
		expect(selectIsAuthenticated(s)).toBe(false)
	})

	it('selectActiveProfileId returns null when no user', () => {
		const s = { auth: { ...root.auth, user: null } } as any
		expect(selectActiveProfileId(s)).toBeNull()
	})

	it('selectProfiles returns [] when no user', () => {
		const s = { auth: { ...root.auth, user: null } } as any
		expect(selectProfiles(s)).toEqual([])
	})
})

describe('authSlice – edge cases', () => {
	it('fetchCurrentUser.fulfilled sets user', () => {
		const user = {
			id: 1,
			username: 'test',
			isAdmin: false,
			avatarUrl: null,
			preferredLanguage: 'en',
			jellyfinUserId: 'j',
			profiles: [],
			activeProfileId: null,
		}
		const state = authReducer(initial, {
			type: fetchCurrentUser.fulfilled.type,
			payload: user,
		})
		expect(state.user).toEqual(user)
	})

	it('unhandled action does not change state', () => {
		const state = authReducer(initial, { type: 'UNKNOWN_ACTION' })
		expect(state).toEqual(initial)
	})

	it('loginUser.rejected clears loading and sets error', () => {
		const state = authReducer(
			{ ...initial, loading: true },
			{
				type: loginUser.rejected.type,
				payload: 'Invalid credentials',
			}
		)
		expect(state.loading).toBe(false)
		expect(state.error).toBe('Invalid credentials')
		expect(state.isAuthenticated).toBe(false)
	})
})
