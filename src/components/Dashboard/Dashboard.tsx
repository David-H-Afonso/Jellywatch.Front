import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectCurrentUser, selectActiveProfileId } from '@/store/features/auth/selector'
import {
	selectCurrentProfile,
	selectProfileActivity,
	selectProfileLoading,
} from '@/store/features/profile'
import { fetchProfileDetail, fetchProfileActivity } from '@/store/features/profile'
import { getUpcoming } from '@/services/StatsService/StatsService'
import { ProfileSelector, WatchStateBadge, MediaPoster } from '@/components/elements'
import { WatchState, MediaType } from '@/models/api/Enums'
import type { UpcomingEpisodeDto } from '@/models/api'
import './Dashboard.scss'

const formatRelativeDate = (
	airDate: string,
	airTime: string | null,
	airTimeUtc: string | null,
	t: (key: string, opts?: Record<string, unknown>) => string,
	locale: string
): string => {
	const now = new Date()

	// When we have a full UTC timestamp, derive EVERYTHING from it (date + time)
	// so the user sees the correct local date, not the network-local date.
	if (airTimeUtc) {
		const utcDate = new Date(airTimeUtc)
		if (!isNaN(utcDate.getTime())) {
			if (utcDate.getTime() < now.getTime() - 12 * 60 * 60 * 1000) return ''

			const timeStr = ` ${utcDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}`

			// Compute day diff using the user-local calendar dates (noon to avoid DST issues)
			const airLocal = new Date(utcDate.toLocaleDateString('en-CA') + 'T12:00:00')
			const todayLocal = new Date(now.toLocaleDateString('en-CA') + 'T12:00:00')
			const diffDays = Math.round(
				(airLocal.getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24)
			)

			if (diffDays <= 0) return t('dashboard.today') + timeStr
			if (diffDays === 1) return t('dashboard.tomorrow') + timeStr
			if (diffDays >= 2 && diffDays <= 6) {
				const weekday = airLocal.toLocaleDateString(locale, { weekday: 'long' })
				return weekday.charAt(0).toUpperCase() + weekday.slice(1) + timeStr
			}
			return t('dashboard.inWeeks', { count: Math.round(diffDays / 7) }) + timeStr
		}
	}

	// Fallback: no UTC timestamp, use network-local airDate + airTime
	const todayStr = now.toLocaleDateString('en-CA')
	if (airDate < todayStr) return ''

	const timeStr = airTime ? ` ${airTime}` : ''

	if (airDate === todayStr) return t('dashboard.today') + timeStr

	const airNoon = new Date(airDate + 'T12:00:00')
	const todayNoon = new Date(todayStr + 'T12:00:00')
	const diffDays = Math.round((airNoon.getTime() - todayNoon.getTime()) / (1000 * 60 * 60 * 24))

	if (diffDays === 1) return t('dashboard.tomorrow') + timeStr
	if (diffDays >= 2 && diffDays <= 6) {
		const weekday = airNoon.toLocaleDateString(locale, { weekday: 'long' })
		return weekday.charAt(0).toUpperCase() + weekday.slice(1) + timeStr
	}
	return t('dashboard.inWeeks', { count: Math.round(diffDays / 7) }) + timeStr
}

const Dashboard: React.FC = () => {
	const { t, i18n } = useTranslation()
	const navigate = useNavigate()
	const dispatch = useAppDispatch()
	const user = useAppSelector(selectCurrentUser)
	const activeProfileId = useAppSelector(selectActiveProfileId)
	const profile = useAppSelector(selectCurrentProfile)
	const activity = useAppSelector(selectProfileActivity)
	const loading = useAppSelector(selectProfileLoading)
	const [upcoming, setUpcoming] = useState<UpcomingEpisodeDto[]>([])

	// Drag-to-scroll
	const scrollRef = useRef<HTMLDivElement>(null)
	const isDragging = useRef(false)
	const didDrag = useRef(false)
	const startX = useRef(0)
	const scrollLeft = useRef(0)
	const DRAG_THRESHOLD = 5

	useEffect(() => {
		const onWindowMouseMove = (e: MouseEvent) => {
			if (!isDragging.current) return
			const el = scrollRef.current
			if (!el) return
			e.preventDefault()
			const dx = e.pageX - startX.current
			if (Math.abs(dx) > DRAG_THRESHOLD) didDrag.current = true
			el.scrollLeft = scrollLeft.current - dx
		}
		const onWindowMouseUp = () => {
			if (!isDragging.current) return
			isDragging.current = false
			const el = scrollRef.current
			if (el) {
				el.style.cursor = 'grab'
				el.style.removeProperty('user-select')
			}
		}
		window.addEventListener('mousemove', onWindowMouseMove)
		window.addEventListener('mouseup', onWindowMouseUp)
		return () => {
			window.removeEventListener('mousemove', onWindowMouseMove)
			window.removeEventListener('mouseup', onWindowMouseUp)
		}
	}, [])

	const onMouseDown = useCallback((e: React.MouseEvent) => {
		const el = scrollRef.current
		if (!el) return
		isDragging.current = true
		didDrag.current = false
		startX.current = e.pageX
		scrollLeft.current = el.scrollLeft
		el.style.cursor = 'grabbing'
		el.style.userSelect = 'none'
	}, [])

	const onClickCapture = useCallback((e: React.MouseEvent) => {
		if (didDrag.current) {
			e.preventDefault()
			e.stopPropagation()
			didDrag.current = false
		}
	}, [])

	useEffect(() => {
		if (activeProfileId) {
			dispatch(fetchProfileDetail(activeProfileId))
			dispatch(fetchProfileActivity({ profileId: activeProfileId, params: { pageSize: 10 } }))
			getUpcoming(activeProfileId, 30)
				.then(setUpcoming)
				.catch(() => setUpcoming([]))
		}
	}, [dispatch, activeProfileId])

	return (
		<div className='dashboard'>
			<div className='dashboard__header'>
				<h1>{t('dashboard.welcome', { name: user?.username ?? '' })}</h1>
				<ProfileSelector />
			</div>

			{loading && <div className='dashboard__loading'>{t('common.loading')}</div>}

			{profile && (
				<div className='dashboard__stats'>
					<h2>{t('dashboard.stats')}</h2>
					<div className='stats-grid'>
						<div className='stat-card'>
							<span className='stat-card__value'>{profile.totalSeriesWatching}</span>
							<span className='stat-card__label'>{t('dashboard.seriesWatching')}</span>
						</div>
						<div className='stat-card'>
							<span className='stat-card__value'>{profile.totalSeriesCompleted}</span>
							<span className='stat-card__label'>{t('dashboard.seriesCompleted')}</span>
						</div>
						<div className='stat-card'>
							<span className='stat-card__value'>{profile.totalMoviesSeen}</span>
							<span className='stat-card__label'>{t('dashboard.moviesSeen')}</span>
						</div>
						<div className='stat-card'>
							<span className='stat-card__value'>{profile.totalEpisodesSeen}</span>
							<span className='stat-card__label'>{t('dashboard.episodesSeen')}</span>
						</div>
					</div>
				</div>
			)}

			{upcoming.length > 0 && (
				<div className='dashboard__upcoming'>
					<h2>{t('dashboard.upcoming')}</h2>
					<div
						className='upcoming-scroll'
						ref={scrollRef}
						onMouseDown={onMouseDown}
						onClickCapture={onClickCapture}>
						{upcoming.map((ep, i) => (
							<div
								key={`${ep.mediaItemId}-${ep.seasonNumber}-${ep.episodeNumber}-${i}`}
								className='upcoming-card'
								onClick={() => navigate(`/series/${ep.seriesId}`)}>
								<div className='upcoming-card__poster-wrap'>
									<MediaPoster
										mediaItemId={ep.mediaItemId}
										alt={ep.seriesTitle}
										className='upcoming-card__poster'
									/>
									<div className='upcoming-card__badge'>
										{formatRelativeDate(ep.airDate, ep.airTime, ep.airTimeUtc, t, i18n.language)}
									</div>
									{ep.batchCount > 1 && (
										<span className='upcoming-card__batch'>+{ep.batchCount - 1}</span>
									)}
								</div>
								<div className='upcoming-card__info'>
									<span className='upcoming-card__title'>{ep.seriesTitle}</span>
									<span className='upcoming-card__episode'>
										S{ep.seasonNumber} · E{ep.episodeNumber}
										{ep.episodeName && ` — ${ep.episodeName}`}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className='dashboard__activity'>
				<h2>{t('dashboard.recentActivity')}</h2>
				{activity.length === 0 && !loading && (
					<p className='empty-state'>{t('dashboard.noActivity')}</p>
				)}
				<div className='activity-list'>
					{activity.map((item) => {
						const link =
							item.mediaType === MediaType.Movie && item.movieId
								? `/movies/${item.movieId}`
								: item.seriesId
									? `/series/${item.seriesId}`
									: null
						return (
							<div key={item.id} className='activity-item'>
								{link ? (
									<Link to={link} className='activity-item__poster-link'>
										<MediaPoster
											mediaItemId={item.mediaItemId}
											alt={item.mediaTitle}
											className='activity-item__poster'
										/>
									</Link>
								) : (
									<MediaPoster
										mediaItemId={item.mediaItemId}
										alt={item.mediaTitle}
										className='activity-item__poster'
									/>
								)}
								<div className='activity-item__info'>
									<span className='activity-item__title'>{item.mediaTitle}</span>
									{item.episodeName && (
										<span className='activity-item__episode'>
											S{item.seasonNumber}E{item.episodeNumber} — {item.episodeName}
										</span>
									)}
									<div className='activity-item__meta'>
										<span className='activity-item__time'>
											{new Date(item.timestamp).toLocaleString()}
										</span>
										{item.createdAt &&
											new Date(item.createdAt).getFullYear() > 1 &&
											Math.abs(
												new Date(item.createdAt).getTime() - new Date(item.timestamp).getTime()
											) > 60_000 && (
												<span className='activity-item__marked-at'>
													({t('activity.markedAt')}: {new Date(item.createdAt).toLocaleString()})
												</span>
											)}
										{item.userRating != null && (
											<span className='activity-item__rating'>
												★ {(item.userRating / 2).toFixed(1)}
											</span>
										)}
										{item.tmdbRating != null && (
											<span className='activity-item__rating activity-item__rating--tmdb'>
												★ {item.tmdbRating.toFixed(1)}
											</span>
										)}
									</div>
								</div>
								<WatchStateBadge
									state={
										item.eventType === 4
											? WatchState.Unseen
											: item.eventType === 3
												? WatchState.Seen
												: WatchState.InProgress
									}
									size='sm'
								/>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}

export default Dashboard
