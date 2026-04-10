import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/elements/Button/Button'

describe('Button', () => {
	it('renders with title text', () => {
		render(<Button title='Click me' onPress={() => {}} />)
		expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
	})

	it('calls onPress when clicked', async () => {
		const user = userEvent.setup()
		const onPress = vi.fn()
		render(<Button title='Go' onPress={onPress} />)

		await user.click(screen.getByRole('button', { name: 'Go' }))
		expect(onPress).toHaveBeenCalledOnce()
	})

	it('renders as a <button> element', () => {
		render(<Button title='Test' onPress={() => {}} />)
		const btn = screen.getByRole('button')
		expect(btn.tagName).toBe('BUTTON')
	})

	it('has the amazing-button class', () => {
		render(<Button title='Styled' onPress={() => {}} />)
		expect(screen.getByRole('button')).toHaveClass('amazing-button')
	})

	it('renders empty string title', () => {
		render(<Button title='' onPress={() => {}} />)
		const btn = screen.getByRole('button')
		expect(btn.textContent).toBe('')
	})

	it('does not call onPress multiple times on single click', async () => {
		const user = userEvent.setup()
		const onPress = vi.fn()
		render(<Button title='Once' onPress={onPress} />)

		await user.click(screen.getByRole('button'))
		expect(onPress).toHaveBeenCalledTimes(1)
	})

	it('renders different title text on rerender', () => {
		const { rerender } = render(<Button title='First' onPress={() => {}} />)
		expect(screen.getByRole('button', { name: 'First' })).toBeInTheDocument()
		rerender(<Button title='Second' onPress={() => {}} />)
		expect(screen.getByRole('button', { name: 'Second' })).toBeInTheDocument()
	})

	it('calls onPress on consecutive clicks', async () => {
		const user = userEvent.setup()
		const onPress = vi.fn()
		render(<Button title='Multi' onPress={onPress} />)

		const btn = screen.getByRole('button')
		await user.click(btn)
		await user.click(btn)
		await user.click(btn)
		expect(onPress).toHaveBeenCalledTimes(3)
	})
})
