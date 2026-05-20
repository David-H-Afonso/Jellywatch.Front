import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import {
	createAuthState,
	createWatchlistDetailDto,
	createWatchlistIndexDto,
	createWatchlistItemDto,
} from '@/test/factories'
import { WatchlistStatus } from '@/models/api/Enums'
import { AddToWatchlistModal } from './AddToWatchlistModal'

const services = vi.hoisted(() => ({
	getWatchlists: vi.fn(),
	getWatchlist: vi.fn(),
	addWatchlistItem: vi.fn(),
	deleteWatchlistItem: vi.fn(),
	createWatchlist: vi.fn(),
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

const renderModal = () =>
	renderWithProviders(
		<AddToWatchlistModal mediaItemId={100} mediaTitle='House of the Dragon' onClose={vi.fn()} />,
		{ preloadedState: { auth: authState } }
	)

describe('AddToWatchlistModal', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		services.getWatchlists.mockResolvedValue(createWatchlistIndexDto())
		services.getWatchlist.mockResolvedValue(createWatchlistDetailDto({ items: [] }))
		services.createWatchlist.mockResolvedValue(createWatchlistDetailDto({ id: 9 }))
	})

	it('adds media to an existing watchlist with the selected status', async () => {
		renderModal()

		fireEvent.click((await screen.findByText('Want to watch')).closest('button')!)
		fireEvent.click(await screen.findByRole('button', { name: 'Watching' }))
		fireEvent.click(screen.getByRole('button', { name: /\+ Add/i }))

		await waitFor(() =>
			expect(services.addWatchlistItem).toHaveBeenCalledWith(
				1,
				expect.objectContaining({ mediaItemId: 100, status: WatchlistStatus.Watching })
			)
		)
	})

	it('marks existing watchlist entries and offers removal', async () => {
		services.getWatchlist.mockResolvedValue(
			createWatchlistDetailDto({ items: [createWatchlistItemDto({ id: 77, mediaItemId: 100 })] })
		)

		renderModal()

		expect(await screen.findByText('Already added')).toBeVisible()
		fireEvent.click(screen.getByRole('button', { name: 'Remove from this watchlist' }))

		await waitFor(() => expect(services.deleteWatchlistItem).toHaveBeenCalledWith(1, 77))
	})

	it('creates a new watchlist and adds the media as initial item', async () => {
		renderModal()

		fireEvent.change(await screen.findByPlaceholderText('Name'), { target: { value: 'Weekend' } })
		fireEvent.click(screen.getByRole('button', { name: 'Create' }))

		await waitFor(() =>
			expect(services.createWatchlist).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Weekend',
					initialItem: expect.objectContaining({ mediaItemId: 100 }),
				}),
				10
			)
		)
	})
})
