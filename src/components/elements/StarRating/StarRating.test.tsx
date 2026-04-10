import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { StarRating } from '@/components/elements/StarRating/StarRating'

const wrap = (ui: React.ReactNode) => render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)

describe('StarRating', () => {
	it('renders 5 star buttons', () => {
		wrap(<StarRating value={null} onChange={() => {}} />)
		const buttons = screen.getAllByRole('button')
		expect(buttons).toHaveLength(5)
	})

	it('calls onChange when a star is clicked', async () => {
		const user = userEvent.setup()
		const onChange = vi.fn()
		wrap(<StarRating value={null} onChange={onChange} />)

		// Click on the 3rd star
		const buttons = screen.getAllByRole('button')
		await user.click(buttons[2])
		expect(onChange).toHaveBeenCalled()
	})

	it('disables buttons when disabled', () => {
		wrap(<StarRating value={6} onChange={() => {}} disabled />)
		const buttons = screen.getAllByRole('button')
		buttons.forEach((btn) => expect(btn).toBeDisabled())
	})

	it('disables buttons when saving', () => {
		wrap(<StarRating value={6} onChange={() => {}} saving />)
		const buttons = screen.getAllByRole('button')
		buttons.forEach((btn) => expect(btn).toBeDisabled())
	})

	it('shows label when provided', () => {
		wrap(<StarRating value={6} onChange={() => {}} label='Season:' />)
		expect(screen.getByText('Season:')).toBeInTheDocument()
	})

	it('shows numeric value when showValue is true', () => {
		wrap(<StarRating value={8} onChange={() => {}} showValue />)
		expect(screen.getByText('4/5')).toBeInTheDocument()
	})

	it('shows saving indicator', () => {
		const { container } = wrap(<StarRating value={6} onChange={() => {}} saving />)
		expect(container.querySelector('.star-rating__saving')).toBeInTheDocument()
	})
})
