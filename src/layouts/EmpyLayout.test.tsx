import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { EmptyLayout } from '@/layouts/EmpyLayout'

describe('EmptyLayout', () => {
	it('renders children directly', () => {
		const { getByText } = render(
			<EmptyLayout>
				<div>Raw Content</div>
			</EmptyLayout>
		)
		expect(getByText('Raw Content')).toBeInTheDocument()
	})

	it('does not add wrapper elements', () => {
		const { container } = render(
			<EmptyLayout>
				<span>Direct</span>
			</EmptyLayout>
		)
		// EmptyLayout uses fragment <></>, so content is directly in the container div
		expect(container.firstElementChild?.tagName).toBe('SPAN')
	})
})
