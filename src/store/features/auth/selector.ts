import type { RootState } from '@/store'

export const selectAuth = (state: RootState) => state.auth

export const selectIsAuthenticated = (state: RootState) =>
	state.auth.isAuthenticated && state.auth.user !== null && state.auth.token !== null

export const selectCurrentUser = (state: RootState) => state.auth.user

export const selectIsAdmin = (state: RootState) => state.auth.user?.isAdmin === true

export const selectAuthLoading = (state: RootState) => state.auth.loading

export const selectAuthError = (state: RootState) => state.auth.error

export const selectAuthToken = (state: RootState) => state.auth.token

export const selectActiveProfileId = (state: RootState) => state.auth.user?.activeProfileId ?? null

export const selectProfiles = (state: RootState) => state.auth.user?.profiles ?? []
