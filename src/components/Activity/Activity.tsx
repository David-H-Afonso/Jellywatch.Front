import React, { useEffect, useCallback, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectActiveProfileId } from '@/store/features/auth/selector'
import {
	selectProfileActivity,
	selectProfileActivityPagination,
	selectProfileLoading,
	selectProfileError,
} from '@/store/features/profile'
import { fetchProfileActivity } from '@/store/features/profile'
import { ProfileSelector, WatchStateBadge, Pagination, MediaPoster } from '@/components/elements'
import { WatchState, MediaType } from '@/models/api/Enums'
import './Activity.scss'

const DATE_PRESETS = ['all', '7d', '30d', '90d', 'custom'] as const

const Activity: React.FC = () => {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const activeProfileId = useAppSelector(selectActiveProfileId)
	const activity = useAppSelector(selectProfileActivity)
	const pagination = useAppSelector(selectProfileActivityPagination)
	const loading = useAppSelector(selectProfileLoading)
	const error = useAppSelector(selectProfileError)
	const [searchParams, setSearchParams] = useSearchParams()

	// Read filters from URL params
	const page = Number(searchParams.get('page')) || 1
	const mediaType = searchParams.get('mediaType') || ''
	const search = searchParams.get('search') || ''
	const sortBy = searchParams.get('sortBy') || 'newest'
	const datePreset = searchParams.get('datePreset') || 'all'
	const dateFrom = searchParams.get('dateFrom') || ''
	const dateTo = searchParams.get('dateTo') || ''

	// Local input state for search debouncing
	const [searchInput, setSearchInput] = useState(search)
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

	const updateParam = useCallback(
		(key: string, value: string) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev)
				if (!value || value === 'all' || value === 'newest') next.delete(key)
				else next.set(key, value)
				// Reset page when changing filters
				if (key !== 'page') next.delete('page')
				return next
			})
		},
		[setSearchParams]
	)

	const setPage = useCallback(
		(p: number) => updateParam('page', p <= 1 ? '' : String(p)),
		[updateParam]
	)

	// Debounced search
	const handleSearchChange = useCallback(
		(value: string) => {
			setSearchInput(value)
			if (debounceRef.current) clearTimeout(debounceRef.current)
			debounceRef.current = setTimeout(() => {
				updateParam('search', value)
			}, 400)
		},
		[updateParam]
	)

	const handleDatePreset = useCallback(
		(preset: string) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev)
				next.delete('page')
				if (preset === 'all') {
					next.delete('datePreset')
					next.delete('dateFrom')
					next.delete('dateTo')
				} else if (preset === 'custom') {
					next.set('datePreset', 'custom')
				} else {
					next.set('datePreset', preset)
					next.delete('dateFrom')
					next.delete('dateTo')
				}
				return next
			})
		},
		[setSearchParams]
	)

	// Compute effective date range
	const getDateRange = useCallback(() => {
		if (datePreset === 'custom') return { dateFrom, dateTo }
		if (datePreset === 'all' || !datePreset) return {}
		const days = datePreset === '7d' ? 7 : datePreset === '30d' ? 30 : 90
		const from = new Date()
		from.setDate(from.getDate() - days)
		return { dateFrom: from.toISOString().slice(0, 10) }
	}, [datePreset, dateFrom, dateTo])

	useEffect(() => {
		if (!activeProfileId) return
		const range = getDateRange()
		dispatch(
			fetchProfileActivity({
				profileId: activeProfileId,
				params: {
					page,
					pageSize: 30,
					search: search || undefined,
					mediaType: mediaType || undefined,
					sortBy,
					dateFrom: range.dateFrom || undefined,
					dateTo: range.dateTo || undefined,
				},
			})
		)
	}, [
		dispatch,
		activeProfileId,
		page,
		search,
		mediaType,
		sortBy,
		datePreset,
		dateFrom,
		dateTo,
		getDateRange,
	])

	const getItemLink = (item: (typeof activity)[0]) => {
		if (item.mediaType === MediaType.Movie && item.movieId) return `/movies/${item.movieId}`
		if (item.seriesId) return `/series/${item.seriesId}`
		return null
	}

	return (
		<div className='activity-page'>
			<div className='activity-page__header'>
				<h1>{t('activity.title')}</h1>
				<ProfileSelector />
			</div>

			{/* Filters bar */}
			<div className='activity-page__filters'>
				<input
					type='text'
					className='activity-page__search'
					placeholder={t('activity.searchPlaceholder')}
					value={searchInput}
					onChange={(e) => handleSearchChange(e.target.value)}
				/>
				<select
					className='activity-page__filter-select'
					value={mediaType}
					onChange={(e) => updateParam('mediaType', e.target.value)}>
					<option value=''>{t('activity.allTypes')}</option>
					<option value='series'>{t('activity.episodesOnly')}</option>
					<option value='movie'>{t('activity.moviesOnly')}</option>
				</select>
				<select
					className='activity-page__filter-select'
					value={sortBy}
					onChange={(e) => updateParam('sortBy', e.target.value)}>
					<option value='newest'>{t('activity.newestFirst')}</option>
					<option value='oldest'>{t('activity.oldestFirst')}</option>
				</select>
				<div className='activity-page__date-presets'>
					{DATE_PRESETS.map((preset) => (
						<button
							key={preset}
							className={`activity-page__date-btn ${datePreset === preset || (!datePreset && preset === 'all') ? 'activity-page__date-btn--active' : ''}`}
							onClick={() => handleDatePreset(preset)}>
							{t(`activity.date.${preset}`)}
						</button>
					))}
				</div>
				{datePreset === 'custom' && (
					<div className='activity-page__custom-dates'>
						<input
							type='date'
							value={dateFrom}
							onChange={(e) => updateParam('dateFrom', e.target.value)}
						/>
						<span>—</span>
						<input
							type='date'
							value={dateTo}
							onChange={(e) => updateParam('dateTo', e.target.value)}
						/>
					</div>
				)}
			</div>

			{loading && <div className='loading-state'>{t('common.loading')}</div>}

			{!loading && error && <p className='error-state'>{error}</p>}

			{!loading && !error && activity.length === 0 && (
				<p className='empty-state'>{t('dashboard.noActivity')}</p>
			)}

			<div className='activity-page__list'>
				{activity.map((item) => {
					const link = getItemLink(item)
					return (
						<div key={item.id} className='activity-page__item'>
							{link ? (
								<Link to={link} className='activity-page__poster-link'>
									<MediaPoster
										mediaItemId={item.mediaItemId}
										alt={item.mediaTitle}
										className='activity-page__poster'
									/>
								</Link>
							) : (
								<MediaPoster
									mediaItemId={item.mediaItemId}
									alt={item.mediaTitle}
									className='activity-page__poster'
								/>
							)}
							<div className='activity-page__info'>
								<span className='activity-page__title'>{item.mediaTitle}</span>
								{item.episodeName && (
									<span className='activity-page__episode'>
										S{item.seasonNumber}E{item.episodeNumber} — {item.episodeName}
									</span>
								)}
								<div className='activity-page__meta'>
									<span className='activity-page__time'>
										{new Date(item.timestamp).toLocaleString()}
									</span>
									{item.createdAt &&
										new Date(item.createdAt).getFullYear() > 1 &&
										Math.abs(
											new Date(item.createdAt).getTime() - new Date(item.timestamp).getTime()
										) > 60_000 && (
											<span className='activity-page__marked-at' title={t('activity.markedAt')}>
												({t('activity.markedAt')}: {new Date(item.createdAt).toLocaleString()})
											</span>
										)}
									{item.userRating != null && (
										<span className='activity-page__rating' title={t('activity.userRating')}>
											★ {(item.userRating / 2).toFixed(1)}
										</span>
									)}
									{item.tmdbRating != null && (
										<span
											className='activity-page__rating activity-page__rating--tmdb'
											title='TMDB'>
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

			{pagination && (
				<Pagination
					page={pagination.page}
					totalPages={pagination.totalPages}
					totalCount={pagination.totalCount}
					onPageChange={setPage}
				/>
			)}
		</div>
	)
}

export default Activity
