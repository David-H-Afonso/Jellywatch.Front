import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import {
	createAuthState,
	createPagedResult,
	createSeriesListDto,
	createWatchlistDetailDto,
	createWatchlistIndexDto,
	createWatchlistInvitationDto,
	createWatchlistItemDto,
	createWatchlistMediaItemDto,
	createWatchlistMemberDto,
	createWatchlistPermissions,
} from '@/test/factories'
import { WatchlistRole, WatchlistStatus } from '@/models/api/Enums'
import Watchlists from './Watchlists'

const services = vi.hoisted(() => ({
	getWatchlists: vi.fn(),
	getWatchlist: vi.fn(),
	getWatchlistUserOptions: vi.fn(),
	getSeries: vi.fn(),
	getMovies: vi.fn(),
	createWatchlist: vi.fn(),
	updateWatchlist: vi.fn(),
	deleteWatchlist: vi.fn(),
	completeWatchlist: vi.fn(),
	addWatchlistItem: vi.fn(),
	updateWatchlistItem: vi.fn(),
	deleteWatchlistItem: vi.fn(),
	reorderWatchlistItems: vi.fn(),
	inviteWatchlistMember: vi.fn(),
	acceptWatchlistInvitation: vi.fn(),
	rejectWatchlistInvitation: vi.fn(),
	requestWatchlistAccess: vi.fn(),
	approveWatchlistAccess: vi.fn(),
	rejectWatchlistAccess: vi.fn(),
	setDefaultWatchlist: vi.fn(),
	updateWatchlistMember: vi.fn(),
	removeWatchlistMember: vi.fn(),
	leaveWatchlist: vi.fn(),
	addMediaToProfile: vi.fn(),
}))

vi.mock('@/services', () => services)

const authState = createAuthState({
	user: {
		id: 1,
		username: 'testuser',
		isAdmin: false,
		avatarUrl: null,
		preferredLanguage: 'en',
		jellyfinUserId: 'jf-user-1',
		profiles: [{ id: 10, displayName: 'Main', jellyfinUserId: 'jf-user-1', isJoint: false }],
		activeProfileId: 10,
	},
})

const renderPage = () =>
	renderWithProviders(<Watchlists />, {
		preloadedState: { auth: authState },
	})

describe('Watchlists page', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		services.getWatchlists.mockResolvedValue(createWatchlistIndexDto())
		services.getWatchlist.mockResolvedValue(createWatchlistDetailDto())
		services.getWatchlistUserOptions.mockResolvedValue([
			{ id: 2, username: 'partner', isMember: false, hasPendingInvitation: false },
		])
		services.getSeries.mockResolvedValue({ data: [], totalCount: 0, page: 1, pageSize: 6, totalPages: 0 })
		services.getMovies.mockResolvedValue({ data: [], totalCount: 0, page: 1, pageSize: 6, totalPages: 0 })
	})

	it('renders watchlists and the selected detail', async () => {
		renderPage()

		expect(await screen.findByText('Weekly queue')).toBeVisible()
		expect(await screen.findByText('House of the Dragon')).toBeVisible()
	})

	it('accepts pending invitations from the sidebar', async () => {
		services.getWatchlists.mockResolvedValue(
			createWatchlistIndexDto({ pendingInvitations: [createWatchlistInvitationDto()] })
		)

		renderPage()

		fireEvent.click(await screen.findByRole('button', { name: 'Accept' }))

		await waitFor(() => expect(services.acceptWatchlistInvitation).toHaveBeenCalledWith(2))
	})

	it('updates item status without touching real watch state', async () => {
		renderPage()

		await screen.findByText('House of the Dragon')
		fireEvent.click(screen.getByRole('button', { name: 'Want to watch' }))
		fireEvent.click(await screen.findByRole('button', { name: 'Dropped' }))

		await waitFor(() =>
			expect(services.updateWatchlistItem).toHaveBeenCalledWith(
				1,
				expect.any(Number),
				expect.objectContaining({ status: WatchlistStatus.Dropped })
			)
		)
	})

	it('adds unavailable media to the active profile from the watchlist', async () => {
		services.getWatchlist.mockResolvedValue(
			createWatchlistDetailDto({
				items: [
					createWatchlistItemDto({
						media: createWatchlistMediaItemDto({
							isInProfile: false,
							canAddToProfile: true,
						}),
					}),
				],
			})
		)

		renderPage()

		fireEvent.click(await screen.findByRole('button', { name: /Add to my media/i }))

		await waitFor(() => expect(services.addMediaToProfile).toHaveBeenCalledWith(10, 100))
	})

	it('creates a new watchlist from the empty state', async () => {
		services.getWatchlists.mockResolvedValue(
			createWatchlistIndexDto({ watchlists: [], defaultWatchlistId: null })
		)
		services.createWatchlist.mockResolvedValue(createWatchlistDetailDto({ id: 9, name: 'New list' }))

		renderPage()

		fireEvent.click(await screen.findByRole('button', { name: /\+ Create first watchlist/i }))
		fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'New list' } })
		fireEvent.click(screen.getByRole('button', { name: 'Create' }))

		await waitFor(() =>
			expect(services.createWatchlist).toHaveBeenCalledWith(
				expect.objectContaining({ name: 'New list' }),
				10
			)
		)
	})

	it('adds media after searching by title', async () => {
		services.getSeries.mockResolvedValue(
			createPagedResult([createSeriesListDto({ title: 'Black Bird', mediaItemId: 321 })])
		)
		services.getMovies.mockResolvedValue(createPagedResult([]))

		renderPage()

		fireEvent.click(await screen.findByRole('button', { name: 'Edit watchlist' }))
		fireEvent.change(await screen.findByPlaceholderText('Search media by name or ID'), {
			target: { value: 'black' },
		})
		fireEvent.click(await screen.findByRole('button', { name: /Black Bird/i }))
		fireEvent.click(screen.getByRole('button', { name: 'Add' }))

		await waitFor(() =>
			expect(services.addWatchlistItem).toHaveBeenCalledWith(
				1,
				expect.objectContaining({ mediaItemId: 321 })
			)
		)
	})

	it('invites a member with explicit member permissions', async () => {
		renderPage()

		fireEvent.click(await screen.findByRole('button', { name: 'Edit watchlist' }))
		const usernameInput = await screen.findByPlaceholderText('Search a user')
		const inviteForm = usernameInput.closest('form')!
		fireEvent.change(usernameInput, { target: { value: 'partner' } })
		fireEvent.click(await screen.findByRole('button', { name: /partner/i }))
		fireEvent.click(within(inviteForm).getByLabelText('Remove items'))
		fireEvent.click(within(inviteForm).getByRole('button', { name: 'Invite' }))

		await waitFor(() =>
			expect(services.inviteWatchlistMember).toHaveBeenCalledWith(
				1,
				expect.objectContaining({
					userId: 2,
					role: WatchlistRole.Member,
					permissions: expect.objectContaining({ canRemoveItems: true }),
				})
			)
		)
	})

	it('updates editable member permissions without touching the owner', async () => {
		const partner = createWatchlistMemberDto({
			id: 7,
			username: 'partner',
			role: WatchlistRole.Member,
			permissions: createWatchlistPermissions({
				canRemoveItems: false,
				canDeleteWatchlist: false,
			}),
		})
		services.getWatchlist.mockResolvedValue(
			createWatchlistDetailDto({
				members: [
					createWatchlistMemberDto({
						id: 1,
						userId: 1,
						username: 'testuser',
						role: WatchlistRole.Owner,
						permissions: createWatchlistPermissions(),
					}),
					partner,
				],
			})
		)

		renderPage()

		fireEvent.click(await screen.findByRole('button', { name: 'Edit watchlist' }))
		const memberCard = (await screen.findByText('partner')).closest(
			'.watchlist-member'
		)! as HTMLElement
		fireEvent.click(within(memberCard).getByRole('button', { name: 'Edit' }))
		fireEvent.click(within(memberCard).getByLabelText('Remove items'))
		fireEvent.click(within(memberCard).getByRole('button', { name: 'Save' }))

		await waitFor(() =>
			expect(services.updateWatchlistMember).toHaveBeenCalledWith(
				1,
				7,
				WatchlistRole.Member,
				expect.objectContaining({ canRemoveItems: true, canDeleteWatchlist: false })
			)
		)
	})
})
