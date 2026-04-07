export interface AuthState {
	isAuthenticated: boolean
	user: {
		id: number
		username: string
		isAdmin: boolean
		avatarUrl: string | null
		preferredLanguage: string
		jellyfinUserId: string
		profiles: ProfileInfo[]
		activeProfileId: number | null
	} | null
	token: string | null
	loading: boolean
	error: string | null
}

export interface ProfileInfo {
	id: number
	displayName: string
	jellyfinUserId: string
	isJoint: boolean
}
