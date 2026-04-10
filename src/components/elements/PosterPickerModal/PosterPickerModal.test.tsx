import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { PosterPickerModal } from '@/components/elements/PosterPickerModal/PosterPickerModal'

vi.mock('@/services/AdminService/AdminService', () => ({
	getPosterOptions: vi.fn(),
	selectPoster: vi.fn(),
	getLogoOptions: vi.fn(),
	selectLogo: vi.fn(),
}))

import {
	getPosterOptions,
	selectPoster,
	getLogoOptions,
} from '@/services/AdminService/AdminService'

const mockGetPosterOptions = vi.mocked(getPosterOptions)
const mockSelectPoster = vi.mocked(selectPoster)
const mockGetLogoOptions = vi.mocked(getLogoOptions)

const mockOptions = [
	{
		id: 1,
		remoteUrl: 'https://img.example.com/poster1.jpg',
		thumbnailUrl: 'https://img.example.com/poster1_thumb.jpg',
		language: 'en',
	},
	{
		id: 2,
		remoteUrl: 'https://img.example.com/poster2.jpg',
		thumbnailUrl: 'https://img.example.com/poster2_thumb.jpg',
		language: 'es',
	},
	{
		id: 3,
		remoteUrl: 'https://img.example.com/poster3.jpg',
		thumbnailUrl: 'https://img.example.com/poster3_thumb.jpg',
		language: null,
	},
]

function renderPicker(props: Partial<React.ComponentProps<typeof PosterPickerModal>> = {}) {
	const defaults = {
		mediaItemId: 42,
		type: 'poster' as const,
		onClose: vi.fn(),
		onSelected: vi.fn(),
	}
	const merged = { ...defaults, ...props }
	return {
		onClose: merged.onClose,
		onSelected: merged.onSelected,
		...render(
			<I18nextProvider i18n={i18n}>
				<PosterPickerModal {...merged} />
			</I18nextProvider>
		),
	}
}

describe('PosterPickerModal', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('shows loading state initially', () => {
		mockGetPosterOptions.mockReturnValue(new Promise(() => {}))
		renderPicker()
		expect(screen.getByText(/loading/i)).toBeInTheDocument()
	})

	it('renders poster options after loading', async () => {
		mockGetPosterOptions.mockResolvedValueOnce(mockOptions as any)
		renderPicker()
		await waitFor(() => {
			expect(screen.getByText('EN')).toBeInTheDocument()
		})
		expect(screen.getByText('ES')).toBeInTheDocument()
		expect(screen.getByText('—')).toBeInTheDocument()
	})

	it('shows empty message when no options', async () => {
		mockGetPosterOptions.mockResolvedValueOnce([])
		renderPicker()
		await waitFor(() => {
			expect(screen.getByText(/no posters found/i)).toBeInTheDocument()
		})
	})

	it('selects a poster and confirms', async () => {
		const user = userEvent.setup()
		mockGetPosterOptions.mockResolvedValueOnce(mockOptions as any)
		mockSelectPoster.mockResolvedValueOnce(undefined as any)
		const { onSelected } = renderPicker()

		await waitFor(() => screen.getByText('EN'))

		// Click on first poster option
		const optionButtons = screen
			.getAllByRole('button')
			.filter((b) => b.className.includes('poster-picker-modal__option'))
		await user.click(optionButtons[0])

		// Click confirm - find by distinguishing from cancel
		const confirmBtn = screen
			.getAllByRole('button')
			.find((b) => b.className.includes('btn-primary'))!
		await user.click(confirmBtn)

		await waitFor(() => {
			expect(mockSelectPoster).toHaveBeenCalledWith(42, 'https://img.example.com/poster1.jpg')
		})
		expect(onSelected).toHaveBeenCalled()
	})

	it('closes when close button clicked', async () => {
		const user = userEvent.setup()
		mockGetPosterOptions.mockResolvedValueOnce(mockOptions as any)
		const { onClose } = renderPicker()

		await user.click(screen.getByLabelText('Close'))
		expect(onClose).toHaveBeenCalled()
	})

	it('closes when overlay clicked', async () => {
		const user = userEvent.setup()
		mockGetPosterOptions.mockResolvedValueOnce(mockOptions as any)
		const { onClose, container } = renderPicker()

		const overlay = container.querySelector('.poster-picker-overlay')!
		await user.click(overlay)
		expect(onClose).toHaveBeenCalled()
	})

	it('uses logo APIs when type is logo', async () => {
		mockGetLogoOptions.mockResolvedValueOnce(mockOptions as any)
		renderPicker({ type: 'logo' })

		await waitFor(() => {
			expect(mockGetLogoOptions).toHaveBeenCalledWith(42)
		})
		expect(mockGetPosterOptions).not.toHaveBeenCalled()
	})

	it('confirm button is disabled without selection', async () => {
		mockGetPosterOptions.mockResolvedValueOnce(mockOptions as any)
		renderPicker()

		await waitFor(() => screen.getByText('EN'))

		const confirmBtn = screen
			.getAllByRole('button')
			.find((b) => b.className.includes('btn-primary'))!
		expect(confirmBtn).toBeDisabled()
	})
})
