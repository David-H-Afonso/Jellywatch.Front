import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectActiveProfileId } from '@/store/features/auth/selector'
import {
	selectSeries,
	selectSeriesLoading,
	selectSeriesError,
	selectSeriesPagination,
	selectSeriesIsDataFresh,
	fetchSeries,
	invalidateCache,
} from '@/store/features/series'
import {
	WatchStateBadge,
	Pagination,
	MediaPoster,
	ProfileSelector,
	ImportMediaModal,
	MediaFilterBar,
} from '@/components/elements'
import type { MediaFilterOptionsDto, MediaQueryParameters } from '@/models/api'
import { getSeriesFilterOptions } from '@/services/MediaService/MediaService'
import { formatUserRating } from '@/utils'
import './SeriesList.scss'

const SeriesList: React.FC = () => {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const series = useAppSelector(selectSeries)
	const loading = useAppSelector(selectSeriesLoading)
	const error = useAppSelector(selectSeriesError)
	const pagination = useAppSelector(selectSeriesPagination)
	const isDataFresh = useAppSelector(selectSeriesIsDataFresh)
	const activeProfileId = useAppSelector(selectActiveProfileId)
	const displayError = error?.includes('HTTP 500') ? t('common.error') : error

	const [searchParams, setSearchParams] = useSearchParams()
	const [importOpen, setImportOpen] = useState(false)
	const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')
	const [filterOptions, setFilterOptions] = useState<MediaFilterOptionsDto>({ genres: [], actors: [], directors: [] })
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

	// All filter state from URL
	const page = Number(searchParams.get('page')) || 1
	const search = searchParams.get('q') ?? ''
	const stateFilter = searchParams.get('state') ?? ''
	const sortBy = searchParams.get('sort') ?? 'title'
	const sortDesc = searchParams.get('desc') === '1'
	const pageSize = Number(searchParams.get('size')) || 20
	const genre = searchParams.get('genre') ?? ''
	const actor = searchParams.get('actor') ?? ''
	const director = searchParams.get('director') ?? ''

	const updateParams = useCallback(
		(updates: Record<string, string | null>, resetPage = true) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev)
				for (const [key, value] of Object.entries(updates)) {
					if (value == null || value === '') {
						next.delete(key)
					} else {
						next.set(key, value)
					}
				}
				// Reset page on filter/sort changes
				if (resetPage && !('page' in updates)) {
					next.delete('page')
				}
				// Clean defaults
				if (next.get('sort') === 'title') next.delete('sort')
				if (next.get('desc') === '0') next.delete('desc')
				if (next.get('size') === '20') next.delete('size')
				if (next.get('page') === '1') next.delete('page')
				return next
			})
		},
		[setSearchParams]
	)

	const buildParams = useCallback((): MediaQueryParameters => {
		const params: MediaQueryParameters = { page, pageSize, sortBy, sortDescending: sortDesc }
		if (search) params.search = search
		if (stateFilter) params.state = stateFilter
		if (genre) params.genre = genre
		if (actor) params.actor = actor
		if (director) params.director = director
		if (activeProfileId) params.profileId = activeProfileId
		return params
	}, [page, search, stateFilter, genre, actor, director, sortBy, sortDesc, activeProfileId, pageSize])

	useEffect(() => {
		dispatch(fetchSeries(buildParams()))
	}, [dispatch, buildParams])

	useEffect(() => {
		getSeriesFilterOptions(activeProfileId ?? undefined).then(setFilterOptions).catch(() => setFilterOptions({ genres: [], actors: [], directors: [] }))
	}, [activeProfileId])

	useEffect(() => {
		if (!isDataFresh) {
			dispatch(fetchSeries(buildParams()))
		}
	}, [dispatch, isDataFresh, buildParams])

	const handleSearchChange = useCallback(
		(value: string) => {
			setSearchInput(value)
			if (debounceRef.current) clearTimeout(debounceRef.current)
			debounceRef.current = setTimeout(() => {
				updateParams({ q: value || null })
			}, 400)
		},
		[updateParams]
	)

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		if (debounceRef.current) clearTimeout(debounceRef.current)
		updateParams({ q: searchInput || null })
	}

	const handlePageChange = (newPage: number) => {
		updateParams({ page: String(newPage) }, false)
	}

	const handleFilterChange = (key: string, value: string | null) => {
		updateParams({ [key]: value })
	}

	const handleAdded = () => {
		dispatch(invalidateCache())
	}

	return (
		<div className='series-list-page'>
			<div className='series-list-page__header'>
				<h1>{t('series.title')}</h1>
				<div className='series-list-page__header-actions'>
					<ProfileSelector />
					{activeProfileId != null && (
						<button className='btn-primary btn-sm' onClick={() => setImportOpen(true)}>
							+ {t('import.title')}
						</button>
					)}
				</div>
			</div>

			<MediaFilterBar
				searchInput={searchInput}
				stateFilter={stateFilter}
				sortBy={sortBy}
				sortDesc={sortDesc}
				pageSize={pageSize}
				genre={genre}
				actor={actor}
				director={director}
				options={filterOptions}
				onSearchChange={handleSearchChange}
				onSearch={handleSearch}
				onChange={handleFilterChange}
			/>

			{displayError && <div className='error-message' role='alert'>{displayError}</div>}

			{loading && series.length === 0 && (
				<div className='loading-state'>{t('common.loading')}</div>
			)}

			{!loading && series.length === 0 && <div className='empty-state'>{t('series.noSeries')}</div>}

			<div className='series-grid'>
				{series.map((s) => (
					<Link key={s.id} to={`/series/${s.id}`} className='series-card'>
						<MediaPoster
							mediaItemId={s.mediaItemId}
							alt={s.title}
							className='series-card__poster'
							fallback='📺'
						/>
						<div className='series-card__info'>
							<h3 className='series-card__title'>{s.title}</h3>
							<div className='series-card__meta'>
								{s.releaseDate && (
									<span className='series-card__year'>{new Date(s.releaseDate).getFullYear()}</span>
								)}
								{s.totalSeasons != null && (
									<span className='series-card__seasons'>
										{s.totalSeasons} {t('series.seasons')}
									</span>
								)}
								<div className='series-card__badges'>
									{s.userRating != null && (
										<span className='series-card__rating'>★ {formatUserRating(s.userRating)}</span>
									)}
								</div>
							</div>
							<div className='series-card__progress'>
								<span className='series-card__episodes'>
									{s.episodesSeen}/{s.totalEpisodes ?? '?'} {t('series.episodes')}
								</span>
								<WatchStateBadge state={s.aggregateState} size='sm' />
							</div>
						</div>
					</Link>
				))}
			</div>

			<Pagination
				page={pagination.page}
				totalPages={pagination.totalPages}
				totalCount={pagination.totalCount}
				onPageChange={handlePageChange}
			/>
			{importOpen && activeProfileId != null && (
				<ImportMediaModal
					profileId={activeProfileId}
					defaultType='series'
					onClose={() => setImportOpen(false)}
					onAdded={handleAdded}
				/>
			)}
		</div>
	)
}

export default SeriesList
