import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { StarRating } from '@/components/elements/StarRating/StarRating'

const wrap = (ui: React.ReactNode) => render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)

describe('StarRating', () => {
	it('renders 10 star buttons', () => {
		wrap(<StarRating value={null} onChange={() => {}} />)
		const buttons = screen.getAllByRole('button')
		expect(buttons).toHaveLength(10)
	})

	it('renders 5 stars when configured for compact mode', () => {
		wrap(<StarRating value={null} onChange={() => {}} starCount={5} />)
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

	it('allows half-point ratings like 7.5', () => {
		const onChange = vi.fn()
		wrap(<StarRating value={null} onChange={onChange} />)

		const buttons = screen.getAllByRole('button')
		const eighthButton = buttons[7] as HTMLButtonElement
		vi.spyOn(eighthButton, 'getBoundingClientRect').mockReturnValue({
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			right: 20,
			bottom: 20,
			width: 20,
			height: 20,
			toJSON: () => ({}),
		})

		fireEvent.click(eighthButton, { clientX: 5 })
		expect(onChange).toHaveBeenCalledWith(7.5)
	})

	it('maps 5 stars to integer scores out of 10', () => {
		const onChange = vi.fn()
		wrap(<StarRating value={null} onChange={onChange} starCount={5} />)

		const buttons = screen.getAllByRole('button')
		const fourthButton = buttons[3] as HTMLButtonElement
		vi.spyOn(fourthButton, 'getBoundingClientRect').mockReturnValue({
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			right: 20,
			bottom: 20,
			width: 20,
			height: 20,
			toJSON: () => ({}),
		})

		fireEvent.click(fourthButton, { clientX: 5 })
		expect(onChange).toHaveBeenCalledWith(7)
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
		wrap(<StarRating value={8.5} onChange={() => {}} showValue />)
		expect(screen.getByText('8.5/10')).toBeInTheDocument()
	})

	it('shows saving indicator', () => {
		const { container } = wrap(<StarRating value={6} onChange={() => {}} saving />)
		expect(container.querySelector('.star-rating__saving')).toBeInTheDocument()
	})
})
