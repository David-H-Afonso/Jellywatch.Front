import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NotFound } from '@/components/errors'

describe('NotFound', () => {
	it('renders 404 heading', () => {
		render(<NotFound />)
		expect(screen.getByText('404')).toBeInTheDocument()
	})

	it('renders page not found message', () => {
		render(<NotFound />)
		expect(screen.getByText('Page not found')).toBeInTheDocument()
	})

	it('renders heading as h1', () => {
		render(<NotFound />)
		const heading = screen.getByRole('heading', { level: 1 })
		expect(heading).toHaveTextContent('404')
	})

	it('renders centered content', () => {
		const { container } = render(<NotFound />)
		const wrapper = container.firstElementChild as HTMLElement
		expect(wrapper.style.textAlign).toBe('center')
	})
})
