import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { createTestStore } from '@/test/utils/createTestStore'
import Calendar from '@/components/Calendar/Calendar'

const today = new Date()
const yyyy = today.getFullYear()
const mm = String(today.getMonth() + 1).padStart(2, '0')

const mockCalendarData = [
	{
		date: `${yyyy}-${mm}-05`,
		events: [
			{
				mediaItemId: 1,
				title: 'Breaking Bad',
				episodeName: 'Pilot',
				seasonNumber: 1,
				episodeNumber: 1,
				mediaType: 'series',
			},
			{
				mediaItemId: 2,
				title: 'Breaking Bad',
				episodeName: 'Cat in the Bag',
				seasonNumber: 1,
				episodeNumber: 2,
				mediaType: 'series',
			},
		],
	},
	{
		date: `${yyyy}-${mm}-15`,
		events: [
			{
				mediaItemId: 10,
				title: 'Inception',
				episodeName: null,
				seasonNumber: null,
				episodeNumber: null,
				mediaType: 'movie',
			},
		],
	},
]

vi.mock('@/services/StatsService/StatsService', () => ({
	getCalendar: vi.fn().mockImplementation(() => Promise.resolve(mockCalendarData)),
}))

vi.mock('@/services/AdminService/AdminService', () => ({
	triggerMineSync: vi.fn().mockResolvedValue(undefined),
}))

const authState = {
	auth: {
		isAuthenticated: true,
		token: 'tok',
		user: {
			id: 1,
			username: 'u',
			isAdmin: false,
			avatarUrl: null,
			preferredLanguage: 'en',
			jellyfinUserId: 'j',
			profiles: [{ id: 10, displayName: 'Main', jellyfinUserId: 'jf-user-1', isJoint: false }],
			activeProfileId: 10,
		},
		loading: false,
		error: null,
	},
}

function renderCalendar() {
	const store = createTestStore(authState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/calendar']}>
						<Routes>
							<Route path='/calendar' element={<Calendar />} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Calendar Flow', () => {
	it('renders calendar heading', async () => {
		renderCalendar()
		await waitFor(() => {
			expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
		})
	})

	it('renders the calendar grid with day headers', async () => {
		renderCalendar()
		await waitFor(() => {
			const gridHeaders = document.querySelectorAll('.calendar-grid__header')
			expect(gridHeaders.length).toBe(7) // mon-sun
		})
	})

	it('shows day cells for the month', async () => {
		renderCalendar()
		await waitFor(() => {
			const cells = document.querySelectorAll(
				'.calendar-grid__cell:not(.calendar-grid__cell--empty)'
			)
			// At least 28 day cells
			expect(cells.length).toBeGreaterThanOrEqual(28)
		})
	})

	it('marks cells with events', async () => {
		renderCalendar()
		await waitFor(() => {
			const eventCells = document.querySelectorAll('.calendar-grid__cell--has-events')
			expect(eventCells.length).toBe(2)
		})
	})

	it('shows event count badge on cells', async () => {
		renderCalendar()
		await waitFor(() => {
			// Day 5 has 2 events
			const counts = document.querySelectorAll('.calendar-grid__count')
			expect(counts.length).toBeGreaterThanOrEqual(1)
		})
	})

	it('clicking a day with events shows detail panel', async () => {
		const user = userEvent.setup()
		renderCalendar()
		await waitFor(() => {
			const eventCells = document.querySelectorAll('.calendar-grid__cell--has-events')
			expect(eventCells.length).toBeGreaterThanOrEqual(1)
		})
		const eventCell = document.querySelector('.calendar-grid__cell--has-events')!
		await user.click(eventCell)
		await waitFor(() => {
			expect(screen.getAllByText('Breaking Bad').length).toBeGreaterThanOrEqual(1)
		})
	})

	it('has month navigation buttons', async () => {
		renderCalendar()
		await waitFor(() => {
			expect(screen.getByText('←')).toBeInTheDocument()
			expect(screen.getByText('→')).toBeInTheDocument()
		})
	})

	it('navigating to previous month works', async () => {
		const user = userEvent.setup()
		renderCalendar()
		await waitFor(() => {
			expect(screen.getByText('←')).toBeInTheDocument()
		})
		await user.click(screen.getByText('←'))
		// Month name should change (grid should re-render)
		await waitFor(() => {
			const monthLabel = document.querySelector('.calendar-page__month')
			expect(monthLabel).toBeInTheDocument()
		})
	})

	it('has filter buttons (all/series/movie)', async () => {
		renderCalendar()
		await waitFor(() => {
			const filterBtns = document.querySelectorAll('.calendar-filter')
			expect(filterBtns.length).toBe(3)
		})
	})
})
