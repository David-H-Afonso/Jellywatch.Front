import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { initCustomFetch } from '@/utils/customFetch'
import { WatchlistItemType, WatchlistRole, WatchlistStatus } from '@/models/api/Enums'
import {
	addWatchlistItem,
	acceptWatchlistInvitation,
	createWatchlist,
	getWatchlists,
	getWatchlistUserOptions,
	leaveWatchlist,
	reorderWatchlistItems,
	requestWatchlistAccess,
	updateWatchlistMember,
} from './WatchlistService'

const BASE = 'http://localhost:5011'

beforeEach(() => {
	initCustomFetch(
		{ getState: () => ({ auth: { token: 'token' } }), dispatch: vi.fn() },
		{ purge: vi.fn().mockResolvedValue(undefined) },
		() => ({ type: 'auth/forceLogout' })
	)
})

describe('WatchlistService', () => {
	it('passes profileId when listing watchlists', async () => {
		let capturedUrl = ''
		server.use(
			http.get(`${BASE}/api/watchlists`, ({ request }) => {
				capturedUrl = request.url
				return HttpResponse.json({
					watchlists: [],
					pendingInvitations: [],
					incomingAccessRequests: [],
					defaultWatchlistId: null,
				})
			})
		)

		await getWatchlists(10)

		expect(capturedUrl).toContain('profileId=10')
	})

	it('creates a watchlist with an initial media item', async () => {
		let body: unknown = null
		server.use(
			http.post(`${BASE}/api/watchlists`, async ({ request }) => {
				body = await request.json()
				return HttpResponse.json({ id: 1, items: [] })
			})
		)

		await createWatchlist({
			name: 'Weekend',
			initialItem: {
				itemType: WatchlistItemType.MediaItem,
				mediaItemId: 50,
				status: WatchlistStatus.Watching,
			},
		})

		expect(body).toMatchObject({
			name: 'Weekend',
			initialItem: { mediaItemId: 50, status: WatchlistStatus.Watching },
		})
	})

	it('adds a media item to a watchlist', async () => {
		let body: unknown = null
		server.use(
			http.post(`${BASE}/api/watchlists/7/items`, async ({ request }) => {
				body = await request.json()
				return new HttpResponse(null, { status: 204 })
			})
		)

		await addWatchlistItem(7, {
			itemType: WatchlistItemType.MediaItem,
			mediaItemId: 12,
			status: WatchlistStatus.WantToWatch,
		})

		expect(body).toMatchObject({ mediaItemId: 12, status: WatchlistStatus.WantToWatch })
	})

	it('reorders items with the complete id list', async () => {
		let body: unknown = null
		server.use(
			http.put(`${BASE}/api/watchlists/7/items/reorder`, async ({ request }) => {
				body = await request.json()
				return new HttpResponse(null, { status: 204 })
			})
		)

		await reorderWatchlistItems(7, [3, 1, 2])

		expect(body).toEqual({ itemIds: [3, 1, 2] })
	})

	it('loads invite user options with watchlist membership flags', async () => {
		let capturedUrl = ''
		server.use(
			http.get(`${BASE}/api/watchlists/users`, ({ request }) => {
				capturedUrl = request.url
				return HttpResponse.json([
					{ id: 2, username: 'Laura', isMember: false, hasPendingInvitation: true },
				])
			})
		)

		const users = await getWatchlistUserOptions('lau', 7)

		expect(capturedUrl).toContain('search=lau')
		expect(capturedUrl).toContain('watchlistId=7')
		expect(users[0].username).toBe('Laura')
	})

	it('leaves a watchlist', async () => {
		let called = false
		server.use(
			http.delete(`${BASE}/api/watchlists/7/me`, () => {
				called = true
				return new HttpResponse(null, { status: 204 })
			})
		)

		await leaveWatchlist(7)

		expect(called).toBe(true)
	})

	it('accepts invitations and creates access requests', async () => {
		const calls: string[] = []
		server.use(
			http.post(`${BASE}/api/watchlists/invitations/4/accept`, () => {
				calls.push('accept')
				return new HttpResponse(null, { status: 204 })
			}),
			http.post(`${BASE}/api/watchlists/9/access-requests`, async ({ request }) => {
				calls.push(String((await request.json() as { message: string }).message))
				return new HttpResponse(null, { status: 204 })
			})
		)

		await acceptWatchlistInvitation(4)
		await requestWatchlistAccess(9, 'Please')

		expect(calls).toEqual(['accept', 'Please'])
	})

	it('updates member role and explicit permissions', async () => {
		let body: unknown = null
		server.use(
			http.put(`${BASE}/api/watchlists/7/members/3`, async ({ request }) => {
				body = await request.json()
				return new HttpResponse(null, { status: 204 })
			})
		)

		await updateWatchlistMember(7, 3, WatchlistRole.Member, {
			canAddItems: true,
			canRemoveItems: false,
			canReorderItems: true,
			canUpdateItemStatus: true,
			canInviteMembers: false,
			canManageMembers: false,
			canUpdateWatchlist: false,
			canDeleteWatchlist: false,
		})

		expect(body).toMatchObject({
			role: WatchlistRole.Member,
			permissions: { canAddItems: true, canRemoveItems: false },
		})
	})
})
