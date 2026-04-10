import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { Pagination } from '@/components/elements/Pagination/Pagination'

const wrap = (ui: React.ReactNode) => render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)

describe('Pagination', () => {
	it('renders nothing when totalPages <= 1', () => {
		const { container } = wrap(
			<Pagination page={1} totalPages={1} totalCount={5} onPageChange={() => {}} />
		)
		expect(container.innerHTML).toBe('')
	})

	it('renders page info and controls', () => {
		wrap(<Pagination page={2} totalPages={5} totalCount={100} onPageChange={() => {}} />)
		expect(screen.getByText(/100/)).toBeInTheDocument()
		expect(screen.getByText(/2/)).toBeInTheDocument()
	})

	it('disables previous button on first page', () => {
		wrap(<Pagination page={1} totalPages={5} totalCount={100} onPageChange={() => {}} />)
		const buttons = screen.getAllByRole('button')
		expect(buttons[0]).toBeDisabled()
	})

	it('disables next button on last page', () => {
		wrap(<Pagination page={5} totalPages={5} totalCount={100} onPageChange={() => {}} />)
		const buttons = screen.getAllByRole('button')
		expect(buttons[buttons.length - 1]).toBeDisabled()
	})

	it('calls onPageChange with page-1 on prev click', async () => {
		const user = userEvent.setup()
		const onPageChange = vi.fn()
		wrap(<Pagination page={3} totalPages={5} totalCount={100} onPageChange={onPageChange} />)

		const prevBtn = screen.getAllByRole('button')[0]
		await user.click(prevBtn)
		expect(onPageChange).toHaveBeenCalledWith(2)
	})

	it('calls onPageChange with page+1 on next click', async () => {
		const user = userEvent.setup()
		const onPageChange = vi.fn()
		wrap(<Pagination page={3} totalPages={5} totalCount={100} onPageChange={onPageChange} />)

		const buttons = screen.getAllByRole('button')
		await user.click(buttons[buttons.length - 1])
		expect(onPageChange).toHaveBeenCalledWith(4)
	})

	it('displays totalCount in info text', () => {
		wrap(<Pagination page={1} totalPages={3} totalCount={42} onPageChange={() => {}} />)
		expect(screen.getByText(/42/)).toBeInTheDocument()
	})

	it('displays current page and total pages', () => {
		wrap(<Pagination page={2} totalPages={5} totalCount={100} onPageChange={() => {}} />)
		expect(screen.getByText(/2/)).toBeInTheDocument()
		expect(screen.getByText(/5/)).toBeInTheDocument()
	})

	it('enables both buttons on middle page', () => {
		wrap(<Pagination page={3} totalPages={5} totalCount={100} onPageChange={() => {}} />)
		const buttons = screen.getAllByRole('button')
		buttons.forEach((btn) => expect(btn).not.toBeDisabled())
	})

	it('has pagination class', () => {
		const { container } = wrap(
			<Pagination page={1} totalPages={3} totalCount={50} onPageChange={() => {}} />
		)
		expect(container.querySelector('.pagination')).toBeInTheDocument()
	})
})
