import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { WatchStateBadge } from '@/components/elements/WatchStateBadge/WatchStateBadge'
import { WatchState } from '@/models/api/Enums'

const wrap = (ui: React.ReactNode) => render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)

describe('WatchStateBadge', () => {
	it('renders unseen badge', () => {
		const { container } = wrap(<WatchStateBadge state={WatchState.Unseen} />)
		expect(container.querySelector('.badge--unseen')).toBeInTheDocument()
	})

	it('renders seen badge', () => {
		const { container } = wrap(<WatchStateBadge state={WatchState.Seen} />)
		expect(container.querySelector('.badge--seen')).toBeInTheDocument()
	})

	it('renders in-progress badge', () => {
		const { container } = wrap(<WatchStateBadge state={WatchState.InProgress} />)
		expect(container.querySelector('.badge--in-progress')).toBeInTheDocument()
	})

	it('renders wont-watch badge', () => {
		const { container } = wrap(<WatchStateBadge state={WatchState.WontWatch} />)
		expect(container.querySelector('.badge--wont-watch')).toBeInTheDocument()
	})

	it('uses sm size class', () => {
		const { container } = wrap(<WatchStateBadge state={WatchState.Seen} size='sm' />)
		expect(container.querySelector('.badge--sm')).toBeInTheDocument()
	})
})
