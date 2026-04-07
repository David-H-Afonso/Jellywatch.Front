import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer from './features/auth/authSlice'
import seriesReducer from './features/series/seriesSlice'
import moviesReducer from './features/movies/moviesSlice'
import profileReducer from './features/profile/profileSlice'
import settingsReducer from './features/settings/settingsSlice'
import adminReducer from './features/admin/adminSlice'

const persistConfig = {
	key: 'root',
	storage,
	whitelist: ['auth'],
}

const rootReducer = combineReducers({
	auth: authReducer,
	series: seriesReducer,
	movies: moviesReducer,
	profile: profileReducer,
	settings: settingsReducer,
	admin: adminReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [
					'persist/FLUSH',
					'persist/REHYDRATE',
					'persist/PAUSE',
					'persist/PERSIST',
					'persist/PURGE',
					'persist/REGISTER',
				],
			},
		}),
	devTools: import.meta.env.DEV,
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
