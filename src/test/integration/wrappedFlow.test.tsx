import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { createTestStore } from '@/test/utils/createTestStore'
import Wrapped from '@/components/Wrapped/Wrapped'
import type { WrappedDto } from '@/models/api/Stats'

const mockWrapped: WrappedDto = {
	year: 2025,
	totalEpisodesWatched: 500,
	totalMoviesWatched: 50,
	totalSeriesWatched: 20,
	totalMinutesWatched: 30000,
	totalDaysActive: 200,
	longestStreakDays: 15,
	busiestDay: '2025-06-15',
	busiestDayCount: 12,
	mostActiveMonth: '6',
	mostActiveMonthCount: 80,
	monthlyActivity: [
		{
			month: 1,
			episodeCount: 40,
			movieCount: 5,
			minutesWatched: 2500,
			series: [],
			movies: [],
		},
		{
			month: 6,
			episodeCount: 70,
			movieCount: 10,
			minutesWatched: 4800,
			series: [
				{
					mediaItemId: 1,
					title: 'Breaking Bad',
					episodeCount: 30,
					episodes: [
						{
							seasonNumber: 1,
							episodeNumber: 1,
							episodeName: 'Pilot',
							watchedAt: '2025-06-01T20:00:00Z',
						},
					],
				},
			],
			movies: [
				{
					mediaItemId: 10,
					title: 'Inception',
					releaseDate: '2010-07-16',
					watchedAt: '2025-06-10T20:00:00Z',
					userRating: 9,
					tmdbRating: 8.4,
				},
			],
		},
	],
	topSeries: [
		{
			mediaItemId: 1,
			title: 'Breaking Bad',
			episodesWatched: 62,
			minutesWatched: 3000,
			userRating: 10,
			tmdbRating: 9.5,
		},
	],
	topMovies: [
		{
			mediaItemId: 10,
			title: 'Inception',
			runtime: 148,
			releaseDate: '2010-07-16',
			watchedAt: '2025-01-15T20:00:00Z',
			userRating: 9,
			tmdbRating: 8.4,
		},
	],
	firstWatch: {
		mediaItemId: 1,
		title: 'Breaking Bad',
		mediaType: 'Series',
		releaseDate: '2008-01-20',
		timestamp: '2025-01-01T10:00:00Z',
		userRating: 10,
		tmdbRating: 9.5,
	},
	topNetworks: [{ network: 'AMC', count: 62 }],
	genreBreakdown: [
		{
			genre: 'Drama',
			totalCount: 100,
			seriesCount: 80,
			movieCount: 20,
			minutesWatched: 6000,
			titles: ['Breaking Bad', 'The Wire'],
		},
		{
			genre: 'Sci-Fi',
			totalCount: 30,
			seriesCount: 10,
			movieCount: 20,
			minutesWatched: 2000,
			titles: ['Inception'],
		},
	],
	monthlyGenreInsights: [
		{ month: 1, topGenre: 'Drama', count: 15 },
		{ month: 6, topGenre: 'Sci-Fi', count: 10 },
	],
}

vi.mock('@/services/StatsService/StatsService', () => ({
	getWrapped: vi.fn().mockImplementation(() => Promise.resolve(mockWrapped)),
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

function renderWrapped() {
	const store = createTestStore(authState)
	return {
		store,
		...render(
			<Provider store={store}>
				<I18nextProvider i18n={i18n}>
					<MemoryRouter initialEntries={['/wrapped']}>
						<Routes>
							<Route path='/wrapped' element={<Wrapped />} />
							<Route path='/series/:id' element={<div>Series Detail</div>} />
							<Route path='/movies/:id' element={<div>Movie Detail</div>} />
						</Routes>
					</MemoryRouter>
				</I18nextProvider>
			</Provider>
		),
	}
}

describe('Wrapped Flow', () => {
	it('renders the wrapped heading', async () => {
		renderWrapped()
		await waitFor(() => {
			expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
		})
	})

	it('displays hero stats', async () => {
		renderWrapped()
		await waitFor(() => {
			expect(screen.getByText('500')).toBeInTheDocument() // episodes
		})
		expect(screen.getByText('50')).toBeInTheDocument() // movies
		expect(screen.getByText('20')).toBeInTheDocument() // series
		expect(screen.getByText('200')).toBeInTheDocument() // days active
		expect(screen.getByText('15')).toBeInTheDocument() // streak
	})

	it('shows total watch time formatted', async () => {
		renderWrapped()
		await waitFor(() => {
			// 30000 min = 500h 0m
			expect(screen.getByText('500h 0m')).toBeInTheDocument()
		})
	})

	it('shows year selector with navigation', async () => {
		renderWrapped()
		await waitFor(() => {
			const yearEl = document.querySelector('.wrapped__year')
			expect(yearEl).toBeInTheDocument()
		})
		expect(screen.getByText('←')).toBeInTheDocument()
		expect(screen.getByText('→')).toBeInTheDocument()
	})

	it('shows top series', async () => {
		renderWrapped()
		await waitFor(() => {
			expect(screen.getAllByText('Breaking Bad').length).toBeGreaterThanOrEqual(1)
		})
		const ranks = screen.getAllByText(/#\d+/)
		expect(ranks.length).toBeGreaterThanOrEqual(1)
	})

	it('shows top movies', async () => {
		renderWrapped()
		await waitFor(() => {
			expect(screen.getByText('Inception')).toBeInTheDocument()
		})
	})

	it('shows first watch section', async () => {
		renderWrapped()
		await waitFor(() => {
			// The first watch title
			const titles = screen.getAllByText('Breaking Bad')
			expect(titles.length).toBeGreaterThanOrEqual(1)
		})
	})

	it('shows top networks', async () => {
		renderWrapped()
		await waitFor(() => {
			expect(screen.getByText('AMC')).toBeInTheDocument()
		})
	})

	it('shows genre breakdown with donut chart', async () => {
		renderWrapped()
		await waitFor(() => {
			expect(screen.getAllByText('Drama').length).toBeGreaterThanOrEqual(1)
			expect(screen.getAllByText('Sci-Fi').length).toBeGreaterThanOrEqual(1)
		})
		// SVG donut should be present
		const donut = document.querySelector('.wrapped__donut')
		expect(donut).toBeInTheDocument()
	})

	it('shows monthly activity chart bars', async () => {
		renderWrapped()
		await waitFor(() => {
			const bars = document.querySelectorAll('.chart-bar')
			expect(bars.length).toBeGreaterThanOrEqual(2)
		})
	})

	it('clicking a month bar expands month detail', async () => {
		const user = userEvent.setup()
		renderWrapped()
		await waitFor(() => {
			const bars = document.querySelectorAll('.chart-bar')
			expect(bars.length).toBeGreaterThanOrEqual(2)
		})
		// Click on the June bar (month 6, which has series/movies data)
		const bars = document.querySelectorAll('.chart-bar')
		const junBar = Array.from(bars).find(
			(b) => b.querySelector('.chart-bar__count')?.textContent === '80'
		)
		if (junBar) {
			await user.click(junBar)
			await waitFor(() => {
				// Should show month detail with series & movies
				expect(screen.getByText(/Pilot/)).toBeInTheDocument()
			})
		}
	})

	it('shows empty state when no data', async () => {
		const { getWrapped } = await import('@/services/StatsService/StatsService')
		vi.mocked(getWrapped).mockResolvedValueOnce({
			...mockWrapped,
			totalEpisodesWatched: 0,
			totalMoviesWatched: 0,
		})
		renderWrapped()
		await waitFor(() => {
			expect(screen.getByText(/no watch activity/i)).toBeInTheDocument()
		})
	})
})
