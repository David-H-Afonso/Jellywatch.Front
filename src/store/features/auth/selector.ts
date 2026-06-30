import type { RootState } from '@/store'
import type { AuthState, ProfileInfo } from '@/models/store/AuthState'

export const selectAuth = (state: RootState) => state.auth

const hasValidUserShape = (user: AuthState['user'] | unknown): user is NonNullable<AuthState['user']> =>
	Boolean(user && typeof user === 'object' && Array.isArray((user as { profiles?: unknown }).profiles))

const selectSafeProfiles = (state: RootState): ProfileInfo[] => {
	const profiles = state.auth.user?.profiles
	return Array.isArray(profiles) ? profiles : []
}

export const selectIsAuthenticated = (state: RootState) =>
	state.auth.isAuthenticated &&
	typeof state.auth.token === 'string' &&
	state.auth.token.length > 0 &&
	hasValidUserShape(state.auth.user)

export const selectCurrentUser = (state: RootState) => state.auth.user

export const selectIsAdmin = (state: RootState) => state.auth.user?.isAdmin === true

export const selectAuthLoading = (state: RootState) => state.auth.loading

export const selectAuthError = (state: RootState) => state.auth.error

export const selectAuthToken = (state: RootState) => state.auth.token

export const selectActiveProfileId = (state: RootState) => {
	const user = state.auth.user
	if (!hasValidUserShape(user)) return null
	return user.activeProfileId ?? selectSafeProfiles(state)[0]?.id ?? null
}

export const selectActiveProfile = (state: RootState): ProfileInfo | null => {
	const activeId = selectActiveProfileId(state)
	if (activeId == null) return null
	return selectSafeProfiles(state).find((profile) => profile.id === activeId) ?? null
}

export const selectProfiles = selectSafeProfiles
