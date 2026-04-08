import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store/hooks'
import { selectActiveProfileId } from '@/store/features/auth/selector'
import { getCalendar } from '@/services/StatsService/StatsService'
import { MediaPoster } from '@/components/elements'
import type { CalendarDayDto } from '@/models/api'
import './Calendar.scss'

const MONTH_KEYS = [
	'january',
	'february',
	'march',
	'april',
	'may',
	'june',
	'july',
	'august',
	'september',
	'october',
	'november',
	'december',
] as const

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const Calendar: React.FC = () => {
	const { t } = useTranslation()
	const activeProfileId = useAppSelector(selectActiveProfileId)
	const [data, setData] = useState<CalendarDayDto[]>([])
	const [loading, setLoading] = useState(true)
	const [year, setYear] = useState(new Date().getFullYear())
	const [month, setMonth] = useState(new Date().getMonth() + 1)
	const [selectedDay, setSelectedDay] = useState<string | null>(null)
	const [filter, setFilter] = useState<'all' | 'series' | 'movie'>('all')

	const fetchData = useCallback(async () => {
		if (!activeProfileId) return
		setLoading(true)
		try {
			const result = await getCalendar(activeProfileId, year, month)
			setData(result)
		} catch {
			setData([])
		} finally {
			setLoading(false)
		}
	}, [activeProfileId, year, month])

	useEffect(() => {
		fetchData()
	}, [fetchData])

	const prevMonth = () => {
		if (month === 1) {
			setMonth(12)
			setYear((y) => y - 1)
		} else {
			setMonth((m) => m - 1)
		}
		setSelectedDay(null)
	}

	const nextMonth = () => {
		const now = new Date()
		if (year === now.getFullYear() && month === now.getMonth() + 1) return
		if (month === 12) {
			setMonth(1)
			setYear((y) => y + 1)
		} else {
			setMonth((m) => m + 1)
		}
		setSelectedDay(null)
	}

	// Build calendar grid
	const firstDay = new Date(year, month - 1, 1)
	const daysInMonth = new Date(year, month, 0).getDate()
	// Monday=0 ... Sunday=6
	const startDow = (firstDay.getDay() + 6) % 7

	const eventMap = new Map<string, CalendarDayDto>()
	for (const d of data) {
		eventMap.set(d.date, d)
	}

	const cells: (number | null)[] = []
	for (let i = 0; i < startDow; i++) cells.push(null)
	for (let d = 1; d <= daysInMonth; d++) cells.push(d)
	while (cells.length % 7 !== 0) cells.push(null)

	const selectedEvents = selectedDay ? (eventMap.get(selectedDay)?.events ?? []) : []
	const filteredEvents =
		filter === 'all' ? selectedEvents : selectedEvents.filter((e) => e.mediaType === filter)

	const isDisabledNext = (() => {
		const now = new Date()
		return year === now.getFullYear() && month === now.getMonth() + 1
	})()

	return (
		<div className='calendar-page'>
			<div className='calendar-page__header'>
				<h1>{t('calendar.title')}</h1>
				<div className='calendar-page__nav'>
					<button onClick={prevMonth}>←</button>
					<span className='calendar-page__month'>
						{t(`wrapped.months.${MONTH_KEYS[month - 1]}`)} {year}
					</span>
					<button onClick={nextMonth} disabled={isDisabledNext}>
						→
					</button>
				</div>
			</div>

			<div className='calendar-page__filters'>
				{(['all', 'series', 'movie'] as const).map((f) => (
					<button
						key={f}
						className={`calendar-filter ${filter === f ? 'calendar-filter--active' : ''}`}
						onClick={() => setFilter(f)}>
						{t(`calendar.filter.${f}`)}
					</button>
				))}
			</div>

			{loading ? (
				<div className='loading-state'>{t('common.loading')}</div>
			) : (
				<>
					<div className='calendar-grid'>
						{DAY_KEYS.map((d) => (
							<div key={d} className='calendar-grid__header'>
								{t(`calendar.days.${d}`)}
							</div>
						))}
						{cells.map((day, i) => {
							if (day === null) {
								return (
									<div
										key={`empty-${i}`}
										className='calendar-grid__cell calendar-grid__cell--empty'
									/>
								)
							}
							const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
							const dayData = eventMap.get(dateStr)
							const count = dayData
								? filter === 'all'
									? dayData.events.length
									: dayData.events.filter((e) => e.mediaType === filter).length
								: 0
							const isSelected = selectedDay === dateStr
							const isToday =
								day === new Date().getDate() &&
								month === new Date().getMonth() + 1 &&
								year === new Date().getFullYear()

							// Get unique media item IDs for poster thumbnails (max 2)
							const dayEvents = dayData
								? filter === 'all'
									? dayData.events
									: dayData.events.filter((e) => e.mediaType === filter)
								: []
							const uniquePosters = [
								...new Map(dayEvents.map((e) => [e.mediaItemId, e])).values(),
							].slice(0, 2)

							return (
								<button
									key={dateStr}
									className={`calendar-grid__cell ${count > 0 ? 'calendar-grid__cell--has-events' : ''} ${isSelected ? 'calendar-grid__cell--selected' : ''} ${isToday ? 'calendar-grid__cell--today' : ''}`}
									onClick={() => setSelectedDay(isSelected ? null : dateStr)}>
									<span className='calendar-grid__day'>{day}</span>
									{uniquePosters.length > 0 && (
										<div className='calendar-grid__posters'>
											{uniquePosters.map((e) => (
												<MediaPoster
													key={e.mediaItemId}
													mediaItemId={e.mediaItemId}
													alt={e.title}
													className='calendar-grid__mini-poster'
												/>
											))}
										</div>
									)}
									{count > 0 && <span className='calendar-grid__count'>+{count}</span>}
								</button>
							)
						})}
					</div>

					{selectedDay && (
						<div className='calendar-page__detail'>
							<h2>
								{new Date(selectedDay + 'T00:00:00').toLocaleDateString(undefined, {
									weekday: 'long',
									day: 'numeric',
									month: 'long',
								})}
							</h2>
							{filteredEvents.length === 0 ? (
								<p className='empty-state'>{t('calendar.noEvents')}</p>
							) : (
								<div className='calendar-events'>
									{filteredEvents.map((e, i) => (
										<div key={`${e.mediaItemId}-${i}`} className='calendar-event'>
											<MediaPoster
												mediaItemId={e.mediaItemId}
												alt={e.title}
												className='calendar-event__poster'
											/>
											<div className='calendar-event__info'>
												<span className='calendar-event__title'>{e.title}</span>
												{e.episodeName && (
													<span className='calendar-event__episode'>
														S{e.seasonNumber}E{e.episodeNumber} — {e.episodeName}
													</span>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</>
			)}
		</div>
	)
}

export default Calendar
