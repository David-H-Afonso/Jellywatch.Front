export const householdScopeDetails = {
	'profile.read': ['Profile summary', 'See the selected profile name and viewing totals.'],
	'activity.read': ['Recent activity', 'See recent viewing activity for the selected profile.'],
	'upcoming.read': ['Upcoming episodes', 'See upcoming episodes for the selected profile.'],
	'media.state.write': ['Update watch state', 'Mark media as seen, watching, or not watching.'],
	'media.rating.write': ['Update ratings', 'Set or clear ratings for media.'],
} as const

export type HouseholdScope = keyof typeof householdScopeDetails

export interface HouseholdAuthorizationRequest {
	clientId: string
	redirectUri: string
	state: string
	codeChallenge: string
	codeChallengeMethod: string
	scopes: HouseholdScope[]
}

export const parseHouseholdAuthorizationRequest = (
	search: string
): HouseholdAuthorizationRequest | null => {
	const query = new URLSearchParams(search)
	const scopes = (query.get('scope') ?? '').split(/\s+/).filter(Boolean)
	if (
		query.get('client_id') !== 'household' ||
		!query.get('redirect_uri') ||
		!query.get('state') ||
		!query.get('code_challenge') ||
		query.get('code_challenge_method') !== 'S256' ||
		scopes.length === 0 ||
		scopes.some((scope) => !(scope in householdScopeDetails))
	) {
		return null
	}

	return {
		clientId: 'household',
		redirectUri: query.get('redirect_uri')!,
		state: query.get('state')!,
		codeChallenge: query.get('code_challenge')!,
		codeChallengeMethod: 'S256',
		scopes: [...new Set(scopes)] as HouseholdScope[],
	}
}
