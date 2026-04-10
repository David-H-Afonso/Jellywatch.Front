import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { ImportMediaModal } from '@/components/elements/ImportMediaModal/ImportMediaModal'

// Mock the service
vi.mock('@/services/MediaService/MediaService', () => ({
	searchTmdb: vi.fn(),
	addManually: vi.fn(),
}))

import { searchTmdb, addManually } from '@/services/MediaService/MediaService'

const mockSearchTmdb = vi.mocked(searchTmdb)
const mockAddManually = vi.mocked(addManually)

const mockSearchResults = [
	{
		id: 101,
		name: 'Breaking Bad',
		first_air_date: '2008-01-20',
		poster_path: '/bb.jpg',
		overview: 'A chemistry teacher turns to crime.',
		vote_average: 9.5,
	},
	{
		id: 102,
		name: 'Better Call Saul',
		first_air_date: '2015-02-08',
		poster_path: null,
		overview: 'The story of Jimmy McGill.',
		vote_average: 8.7,
	},
]

function renderModal(props: Partial<React.ComponentProps<typeof ImportMediaModal>> = {}) {
	const defaults = {
		profileId: 1,
		defaultType: 'series' as const,
		onClose: vi.fn(),
		onAdded: vi.fn(),
	}
	const merged = { ...defaults, ...props }
	return {
		onClose: merged.onClose,
		onAdded: merged.onAdded,
		...render(
			<I18nextProvider i18n={i18n}>
				<ImportMediaModal {...merged} />
			</I18nextProvider>
		),
	}
}

describe('ImportMediaModal', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders modal with search form', () => {
		renderModal()
		expect(screen.getByRole('heading')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
	})

	it('closes when close button clicked', async () => {
		const user = userEvent.setup()
		const { onClose } = renderModal()
		await user.click(screen.getByRole('button', { name: /close/i }))
		expect(onClose).toHaveBeenCalled()
	})

	it('closes when overlay clicked', async () => {
		const user = userEvent.setup()
		const { onClose, container } = renderModal()
		const overlay = container.querySelector('.import-overlay')!
		await user.click(overlay)
		expect(onClose).toHaveBeenCalled()
	})

	it('performs search and shows results', async () => {
		const user = userEvent.setup()
		mockSearchTmdb.mockResolvedValueOnce(mockSearchResults as any)
		renderModal()

		const input = screen.getByPlaceholderText(/title/i)
		await user.type(input, 'Breaking')

		const submitBtn = screen.getByRole('button', { name: /^search$/i })
		await user.click(submitBtn)

		await waitFor(() => {
			expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
		})
		expect(screen.getByText('Better Call Saul')).toBeInTheDocument()
		expect(mockSearchTmdb).toHaveBeenCalledWith('Breaking', 'series', undefined)
	})

	it('adds media item from search results', async () => {
		const user = userEvent.setup()
		mockSearchTmdb.mockResolvedValueOnce(mockSearchResults as any)
		mockAddManually.mockResolvedValueOnce(undefined as any)
		const { onAdded } = renderModal()

		const input = screen.getByPlaceholderText(/title/i)
		await user.type(input, 'Breaking')
		await user.click(screen.getByRole('button', { name: /^search$/i }))

		await waitFor(() => screen.getByText('Breaking Bad'))

		// Find and click the first Add button
		const addButtons = screen
			.getAllByRole('button')
			.filter((b) => b.textContent?.match(/^(Add|add)$/i))
		await user.click(addButtons[0])

		await waitFor(() => {
			expect(mockAddManually).toHaveBeenCalledWith({
				tmdbId: 101,
				type: 'series',
				profileId: 1,
			})
		})
		expect(onAdded).toHaveBeenCalled()
	})

	it('switches between series and movie tabs', async () => {
		const user = userEvent.setup()
		renderModal()

		const movieTab = screen.getByRole('button', { name: /🎬/i })
		await user.click(movieTab)
		// Tab should now be active
		expect(movieTab.className).toContain('active')
	})

	it('switches to add by ID mode', async () => {
		const user = userEvent.setup()
		renderModal()

		// Find the "Add by ID" tab
		const tabs = screen.getAllByRole('button')
		const idTab = tabs.find((b) => b.textContent?.match(/id/i))
		if (idTab) {
			await user.click(idTab)
			expect(screen.getByPlaceholderText(/tmdb/i)).toBeInTheDocument()
		}
	})

	it('adds media by TMDB ID', async () => {
		const user = userEvent.setup()
		mockAddManually.mockResolvedValueOnce(undefined as any)
		const { onAdded } = renderModal()

		// Switch to ID mode
		const idTab = screen.getByText(/add by tmdb/i)
		await user.click(idTab)

		const idInput = screen.getByPlaceholderText(/tmdb/i)
		await user.type(idInput, '12345')

		// Submit button in ID form
		const submitBtn = screen.getByRole('button', { name: /add to library/i })
		await user.click(submitBtn)

		await waitFor(() => expect(mockAddManually).toHaveBeenCalled())
		expect(onAdded).toHaveBeenCalled()
	})

	it('shows no results message', async () => {
		const user = userEvent.setup()
		mockSearchTmdb.mockResolvedValueOnce([])
		renderModal()

		const input = screen.getByPlaceholderText(/title/i)
		await user.type(input, 'nonexistent')
		await user.click(screen.getByRole('button', { name: /^search$/i }))

		await waitFor(() => {
			expect(screen.getByText(/no results/i)).toBeInTheDocument()
		})
	})
})
