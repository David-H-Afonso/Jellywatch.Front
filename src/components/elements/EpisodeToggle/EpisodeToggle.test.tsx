import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { EpisodeToggle } from '@/components/elements/EpisodeToggle/EpisodeToggle'
import { WatchState } from '@/models/api/Enums'

function renderToggle(props: Partial<React.ComponentProps<typeof EpisodeToggle>> = {}) {
	const defaults = {
		state: WatchState.Unseen,
		isManualOverride: false,
		onToggle: vi.fn(),
		disabled: false,
		airDate: null,
	}
	const merged = { ...defaults, ...props }
	return {
		onToggle: merged.onToggle,
		...render(
			<I18nextProvider i18n={i18n}>
				<EpisodeToggle {...merged} />
			</I18nextProvider>
		),
	}
}

describe('EpisodeToggle', () => {
	it('renders toggle buttons', () => {
		renderToggle()
		const buttons = screen.getAllByRole('button')
		// Main toggle + date trigger + won't watch = 3 buttons when unseen
		expect(buttons.length).toBeGreaterThanOrEqual(2)
	})

	it('clicking unseen episode marks as seen', async () => {
		const user = userEvent.setup()
		const { onToggle } = renderToggle({ state: WatchState.Unseen })
		const mainBtn = screen.getAllByRole('button')[0]
		await user.click(mainBtn)
		expect(onToggle).toHaveBeenCalledWith(WatchState.Seen, expect.any(String))
	})

	it('clicking seen episode marks as unseen', async () => {
		const user = userEvent.setup()
		const { onToggle } = renderToggle({ state: WatchState.Seen })
		const mainBtn = screen.getAllByRole('button')[0]
		await user.click(mainBtn)
		expect(onToggle).toHaveBeenCalledWith(WatchState.Unseen)
	})

	it('disabled toggle does not call onToggle', async () => {
		const user = userEvent.setup()
		const { onToggle } = renderToggle({ disabled: true })
		const mainBtn = screen.getAllByRole('button')[0]
		await user.click(mainBtn)
		expect(onToggle).not.toHaveBeenCalled()
	})

	it('shows correct title for manually overridden watched', () => {
		renderToggle({ state: WatchState.Seen, isManualOverride: true })
		expect(screen.getByTitle('Manually marked as watched')).toBeInTheDocument()
	})

	it('shows correct title for unseen', () => {
		renderToggle({ state: WatchState.Unseen, isManualOverride: false })
		expect(screen.getByTitle('Not watched')).toBeInTheDocument()
	})

	it("won't watch button toggles WontWatch state", async () => {
		const user = userEvent.setup()
		const { onToggle } = renderToggle({ state: WatchState.Unseen })
		// Won't watch button is the last button
		const buttons = screen.getAllByRole('button')
		const skipBtn = buttons.find((b) => b.title === "Won't watch")!
		await user.click(skipBtn)
		expect(onToggle).toHaveBeenCalledWith(WatchState.WontWatch)
	})

	it("won't watch button un-skips when already WontWatch", async () => {
		const user = userEvent.setup()
		const { onToggle } = renderToggle({ state: WatchState.WontWatch })
		// Skip button has the 'episode-toggle__skip' class
		const skipBtn = document.querySelector('.episode-toggle__skip')!
		await user.click(skipBtn)
		expect(onToggle).toHaveBeenCalledWith(WatchState.Unseen)
	})

	it('hides date trigger when episode is already seen', () => {
		renderToggle({ state: WatchState.Seen })
		// Date trigger should not be present for seen episodes
		const buttons = screen.getAllByRole('button')
		// Only main toggle + won't watch = 2 buttons
		expect(buttons).toHaveLength(2)
	})

	it('shows date trigger when unseen', () => {
		renderToggle({ state: WatchState.Unseen })
		const buttons = screen.getAllByRole('button')
		// Main toggle + date trigger + won't watch = 3 buttons
		expect(buttons).toHaveLength(3)
	})

	it('opens date menu on date trigger click', async () => {
		const user = userEvent.setup()
		renderToggle({ state: WatchState.Unseen, airDate: '2025-06-15' })
		const buttons = screen.getAllByRole('button')
		// date trigger is the second button
		const dateTrigger = buttons[1]
		await user.click(dateTrigger)
		// Date menu should show options
		expect(screen.getByText(/watchedNow|Watched now/i)).toBeInTheDocument()
	})
})
