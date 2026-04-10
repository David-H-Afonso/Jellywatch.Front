import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { LayoutProvider } from './LayoutProvider'
import { createTestStore } from '@/test/utils/createTestStore'

function renderWithAll(ui: React.ReactElement) {
	return render(
		<Provider store={createTestStore()}>
			<MemoryRouter>
				<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
			</MemoryRouter>
		</Provider>
	)
}

describe('LayoutProvider', () => {
	it('renders children inside the layout', () => {
		renderWithAll(
			<LayoutProvider>
				<div data-testid='child'>Hello</div>
			</LayoutProvider>
		)
		expect(screen.getByTestId('child')).toBeInTheDocument()
	})

	it('renders AppLayout by default', () => {
		const { container } = renderWithAll(
			<LayoutProvider>
				<span>content</span>
			</LayoutProvider>
		)
		expect(container.querySelector('.app-layout, header, nav, main')).toBeTruthy()
	})
})
