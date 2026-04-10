import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { LanguageSwitcher } from '@/components/elements/LanguageSwitcher/LanguageSwitcher'

const wrap = (ui: React.ReactNode) => render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)

describe('LanguageSwitcher', () => {
	it('renders a button with current language', () => {
		wrap(<LanguageSwitcher />)
		const btn = screen.getByRole('button')
		expect(btn).toBeInTheDocument()
		expect(btn.textContent).toMatch(/^(ES|EN)$/)
	})

	it('toggles language on click', async () => {
		const user = userEvent.setup()
		wrap(<LanguageSwitcher />)

		const btn = screen.getByRole('button')
		const before = btn.textContent
		await user.click(btn)
		const after = btn.textContent

		expect(before).not.toBe(after)
	})

	it('renders as a button element', () => {
		wrap(<LanguageSwitcher />)
		const btn = screen.getByRole('button')
		expect(btn.tagName).toBe('BUTTON')
	})

	it('toggles back on second click', async () => {
		const user = userEvent.setup()
		wrap(<LanguageSwitcher />)

		const btn = screen.getByRole('button')
		const original = btn.textContent
		await user.click(btn)
		await user.click(btn)
		expect(btn.textContent).toBe(original)
	})
})
