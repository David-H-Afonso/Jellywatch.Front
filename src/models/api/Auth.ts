export interface JellyfinLoginRequest {
	serverUrl: string
	username: string
	password: string
}

export interface LoginResponse {
	userId: number
	username: string
	token: string
	isAdmin: boolean
}

export interface UserDto {
	id: number
	username: string
	jellyfinUserId: string
	isAdmin: boolean
	avatarUrl: string | null
	preferredLanguage: string
	createdAt: string
}

export interface UserMeResponse {
	id: number
	jellyfinUserId: string
	username: string
	isAdmin: boolean
	avatarUrl: string | null
	preferredLanguage: string
	profiles: ProfileDto[]
}

export interface ProfileDto {
	id: number
	displayName: string
	jellyfinUserId: string
	isJoint: boolean
	userId?: number
	createdAt?: string
}

export interface ProfileDetailDto extends ProfileDto {
	totalSeriesWatching: number
	totalSeriesCompleted: number
	totalMoviesSeen: number
	totalEpisodesSeen: number
}

export interface PropagationRuleDto {
	id: number
	sourceProfileId: number
	sourceProfileName: string
	targetProfileId: number
	targetProfileName: string
	isActive: boolean
}

export interface PropagationRuleCreateDto {
	sourceProfileId: number
	targetProfileId: number
	isActive?: boolean
}
