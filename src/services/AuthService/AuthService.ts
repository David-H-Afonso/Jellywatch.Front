import { environment } from '@/environments'
import type { JellyfinLoginRequest, LoginResponse, UserMeResponse } from '@/models/api/Auth'

class AuthService {
	async login(credentials: JellyfinLoginRequest): Promise<LoginResponse> {
		const url = `${environment.baseUrl}${environment.apiRoutes.auth.login}`

		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(credentials),
		})

		if (!response.ok) {
			if (response.status === 401) {
				throw new Error('Invalid Jellyfin credentials')
			}
			const errorData = await response.json().catch(() => ({}))
			throw new Error(errorData.message || 'Login failed')
		}

		return await response.json()
	}

	logout(): void {
		// Redux handles clearing state
	}
}

export const authService = new AuthService()

class UserService {
	async getMe(): Promise<UserMeResponse> {
		const { customFetch } = await import('@/utils/customFetch')
		return customFetch<UserMeResponse>(environment.apiRoutes.auth.me)
	}
}

export const userService = new UserService()
