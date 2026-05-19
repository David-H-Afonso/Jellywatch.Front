import { environment } from '@/environments'
import type { JellyfinLoginRequest, LoginResponse, UserMeResponse } from '@/models/api/Auth'

const apiReturnedHtmlMessage =
	'API returned HTML instead of JSON. Check that /api routes are being proxied to the Jellywatch API.'

const parseErrorMessage = async (response: Response): Promise<string> => {
	const contentType = response.headers.get('content-type') || ''
	if (contentType.includes('application/json')) {
		const errorData = await response.json().catch(() => ({}))
		return errorData.message || errorData.error || 'Login failed'
	}
	return (await response.text().catch(() => '')) || 'Login failed'
}

class AuthService {
	async login(credentials: JellyfinLoginRequest): Promise<LoginResponse> {
		const url = `${environment.baseUrl}${environment.apiRoutes.auth.login}`

		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(credentials),
		})

		const contentType = response.headers.get('content-type') || ''
		if (contentType.includes('text/html')) {
			throw new Error(apiReturnedHtmlMessage)
		}

		if (!response.ok) {
			if (response.status === 401) {
				throw new Error('Invalid Jellyfin credentials')
			}
			throw new Error(await parseErrorMessage(response))
		}

		if (!contentType.includes('application/json')) {
			throw new Error('Login response was not JSON')
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
