import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { SyncButton } from '@/components/elements/SyncButton/SyncButton'

const wrap = (ui: React.ReactNode) => render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)

describe('SyncButton', () => {
	it('renders a button', () => {
		wrap(<SyncButton onSync={async () => {}} />)
		expect(screen.getByRole('button')).toBeInTheDocument()
	})

	it('calls onSync when clicked', async () => {
		const user = userEvent.setup()
		const onSync = vi.fn(() => Promise.resolve())
		wrap(<SyncButton onSync={onSync} />)

		await user.click(screen.getByRole('button'))
		expect(onSync).toHaveBeenCalledOnce()
	})

	it('disables button while syncing', async () => {
		const user = userEvent.setup()
		let resolve: () => void
		const onSync = vi.fn(
			() =>
				new Promise<void>((r) => {
					resolve = r
				})
		)
		wrap(<SyncButton onSync={onSync} />)

		const btn = screen.getByRole('button')
		await user.click(btn)

		expect(btn).toBeDisabled()
		resolve!()
	})

	it('shows label text when withLabel is true', () => {
		wrap(<SyncButton onSync={async () => {}} withLabel />)
		expect(screen.getByRole('button').querySelector('.sync-btn__label')).toBeInTheDocument()
	})
})
