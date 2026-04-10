import { configureStore, combineReducers } from '@reduxjs/toolkit'
import authReducer from '@/store/features/auth/authSlice'
import seriesReducer from '@/store/features/series/seriesSlice'
import moviesReducer from '@/store/features/movies/moviesSlice'
import profileReducer from '@/store/features/profile/profileSlice'
import settingsReducer from '@/store/features/settings/settingsSlice'
import adminReducer from '@/store/features/admin/adminSlice'
import type { RootState } from '@/store'

const rootReducer = combineReducers({
	auth: authReducer,
	series: seriesReducer,
	movies: moviesReducer,
	profile: profileReducer,
	settings: settingsReducer,
	admin: adminReducer,
})

export const createTestStore = (preloadedState?: Partial<RootState>) =>
	configureStore({
		reducer: rootReducer,
		preloadedState: preloadedState as any,
	})

export type TestStore = ReturnType<typeof createTestStore>
