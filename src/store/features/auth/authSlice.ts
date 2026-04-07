import { createSlice, createAsyncThunk, createAction, type PayloadAction } from '@reduxjs/toolkit'
import { authService, userService } from '@/services'
import type { JellyfinLoginRequest } from '@/models/api/Auth'
import type { AuthState, ProfileInfo } from '@/models/store/AuthState'

const setLoginToken = createAction<string>('auth/setLoginToken')

const initialState: AuthState = {
	isAuthenticated: false,
	user: null,
	token: null,
	loading: false,
	error: null,
}

export const loginUser = createAsyncThunk(
	'auth/login',
	async (credentials: JellyfinLoginRequest, { rejectWithValue, dispatch }) => {
		try {
			const response = await authService.login(credentials)
			dispatch(setLoginToken(response.token))
			await dispatch(fetchCurrentUser())
			return response
		} catch (error) {
			if (error instanceof Error) {
				return rejectWithValue(error.message)
			}
			return rejectWithValue('Login failed')
		}
	}
)

export const logoutUser = createAsyncThunk('auth/logout', async () => {
	authService.logout()
})

export const fetchCurrentUser = createAsyncThunk(
	'auth/fetchCurrentUser',
	async (_, { rejectWithValue }) => {
		try {
			const me = await userService.getMe()
			return me
		} catch (error) {
			if (error instanceof Error) {
				return rejectWithValue(error.message)
			}
			return rejectWithValue('Failed to fetch user info')
		}
	}
)

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null
		},
		forceLogout: (state) => {
			state.isAuthenticated = false
			state.user = null
			state.token = null
			state.error = null
		},
		setActiveProfile: (state, action: PayloadAction<number>) => {
			if (state.user) {
				state.user.activeProfileId = action.payload
			}
		},
	},
	extraReducers: (builder) => {
		builder.addCase(setLoginToken, (state, action) => {
			state.token = action.payload
		})

		builder
			.addCase(loginUser.pending, (state) => {
				state.loading = true
				state.error = null
			})
			.addCase(loginUser.fulfilled, (state, action) => {
				state.loading = false
				state.isAuthenticated = true
				state.token = action.payload.token
				state.error = null
			})
			.addCase(loginUser.rejected, (state, action) => {
				state.loading = false
				state.isAuthenticated = false
				state.user = null
				state.token = null
				state.error = action.payload as string
			})

		builder.addCase(logoutUser.fulfilled, (state) => {
			state.isAuthenticated = false
			state.user = null
			state.token = null
			state.error = null
		})

		builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
			const me = action.payload
			const profiles: ProfileInfo[] = me.profiles.map((p) => ({
				id: p.id,
				displayName: p.displayName,
				jellyfinUserId: p.jellyfinUserId,
				isJoint: p.isJoint,
			}))
			state.user = {
				id: me.id,
				username: me.username,
				isAdmin: me.isAdmin,
				avatarUrl: me.avatarUrl,
				preferredLanguage: me.preferredLanguage,
				jellyfinUserId: me.jellyfinUserId,
				profiles,
				activeProfileId: state.user?.activeProfileId ?? profiles[0]?.id ?? null,
			}
		})
	},
})

export const { clearError, forceLogout, setActiveProfile } = authSlice.actions
export default authSlice.reducer
