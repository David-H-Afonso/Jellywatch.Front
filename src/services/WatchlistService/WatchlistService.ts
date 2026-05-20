import { customFetch } from '@/utils/customFetch'
import { environment } from '@/environments'
import type {
	AddWatchlistItemDto,
	CreateWatchlistDto,
	InviteWatchlistMemberDto,
	UpdateWatchlistDto,
	UpdateWatchlistItemDto,
	WatchlistDetailDto,
	WatchlistIndexDto,
	WatchlistPermissionsDto,
	WatchlistRole,
	WatchlistUserOptionDto,
} from '@/models/api'

const { apiRoutes } = environment

export const getWatchlists = async (profileId?: number | null): Promise<WatchlistIndexDto> => {
	return await customFetch<WatchlistIndexDto>(apiRoutes.watchlists.base, {
		params: profileId ? { profileId } : undefined,
	})
}

export const getWatchlist = async (
	id: number,
	profileId?: number | null
): Promise<WatchlistDetailDto> => {
	return await customFetch<WatchlistDetailDto>(apiRoutes.watchlists.byId(id), {
		params: profileId ? { profileId } : undefined,
	})
}

export const getWatchlistUserOptions = async (
	search?: string,
	watchlistId?: number | null
): Promise<WatchlistUserOptionDto[]> => {
	return await customFetch<WatchlistUserOptionDto[]>(apiRoutes.watchlists.users, {
		params: {
			...(search?.trim() ? { search: search.trim() } : {}),
			...(watchlistId ? { watchlistId } : {}),
		},
	})
}

export const createWatchlist = async (
	data: CreateWatchlistDto,
	profileId?: number | null
): Promise<WatchlistDetailDto> => {
	return await customFetch<WatchlistDetailDto>(apiRoutes.watchlists.base, {
		method: 'POST',
		params: profileId ? { profileId } : undefined,
		body: data,
	})
}

export const updateWatchlist = async (id: number, data: UpdateWatchlistDto): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.byId(id), { method: 'PUT', body: data })
}

export const deleteWatchlist = async (id: number): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.byId(id), { method: 'DELETE' })
}

export const completeWatchlist = async (id: number): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.complete(id), { method: 'POST' })
}

export const addWatchlistItem = async (
	id: number,
	data: AddWatchlistItemDto
): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.items(id), { method: 'POST', body: data })
}

export const updateWatchlistItem = async (
	id: number,
	itemId: number,
	data: UpdateWatchlistItemDto
): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.item(id, itemId), { method: 'PUT', body: data })
}

export const deleteWatchlistItem = async (id: number, itemId: number): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.item(id, itemId), { method: 'DELETE' })
}

export const reorderWatchlistItems = async (id: number, itemIds: number[]): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.reorder(id), {
		method: 'PUT',
		body: { itemIds },
	})
}

export const inviteWatchlistMember = async (
	id: number,
	data: InviteWatchlistMemberDto
): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.invite(id), { method: 'POST', body: data })
}

export const updateWatchlistMember = async (
	id: number,
	memberId: number,
	role: WatchlistRole,
	permissions: WatchlistPermissionsDto
): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.member(id, memberId), {
		method: 'PUT',
		body: { role, permissions },
	})
}

export const removeWatchlistMember = async (id: number, memberId: number): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.member(id, memberId), { method: 'DELETE' })
}

export const leaveWatchlist = async (id: number): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.leave(id), { method: 'DELETE' })
}

export const acceptWatchlistInvitation = async (invitationId: number): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.acceptInvitation(invitationId), { method: 'POST' })
}

export const rejectWatchlistInvitation = async (invitationId: number): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.rejectInvitation(invitationId), { method: 'POST' })
}

export const requestWatchlistAccess = async (
	watchlistId: number,
	message?: string
): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.requestAccess(watchlistId), {
		method: 'POST',
		body: { message },
	})
}

export const approveWatchlistAccess = async (requestId: number): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.approveAccess(requestId), { method: 'POST' })
}

export const rejectWatchlistAccess = async (requestId: number): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.rejectAccess(requestId), { method: 'POST' })
}

export const setDefaultWatchlist = async (watchlistId: number | null): Promise<void> => {
	await customFetch<void>(apiRoutes.watchlists.default, { method: 'PUT', body: { watchlistId } })
}
