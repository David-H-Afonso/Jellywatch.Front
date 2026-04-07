import React, { useEffect, useState, useCallback } from 'react'
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
} from '@/components/elements'
import type { MediaQueryParameters } from '@/models/api'
import { WatchState } from '@/models/api/Enums'
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

	const [searchParams, setSearchParams] = useSearchParams()

	const [search, setSearch] = useState('')
	const [stateFilter, setStateFilter] = useState<string>('')
	const [sortBy, setSortBy] = useState('title')
	const [sortDesc, setSortDesc] = useState(false)
	const [importOpen, setImportOpen] = useState(false)

	const page = Number(searchParams.get('page')) || 1
	const setPage = useCallback(
		(p: number) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev)
				if (p <= 1) next.delete('page')
				else next.set('page', String(p))
				return next
			})
		},
		[setSearchParams]
	)

	const buildParams = useCallback((): MediaQueryParameters => {
		const params: MediaQueryParameters = { page, pageSize: 20, sortBy, sortDescending: sortDesc }
		if (search) params.search = search
		if (stateFilter) params.state = stateFilter
		if (activeProfileId) params.profileId = activeProfileId
		return params
	}, [page, search, stateFilter, sortBy, sortDesc, activeProfileId])

	useEffect(() => {
		dispatch(fetchSeries(buildParams()))
	}, [dispatch, buildParams])

	useEffect(() => {
		if (!isDataFresh) {
			dispatch(fetchSeries(buildParams()))
		}
	}, [dispatch, isDataFresh, buildParams])

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		setPage(1)
		dispatch(fetchSeries(buildParams()))
	}

	const handlePageChange = (newPage: number) => {
		setPage(newPage)
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

			<div className='series-list-page__filters'>
				<form className='search-form' onSubmit={handleSearch}>
					<input
						type='text'
						className='search-input'
						placeholder={t('common.search')}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</form>
				<select
					className='state-filter'
					value={stateFilter}
					onChange={(e) => {
						setStateFilter(e.target.value)
						setPage(1)
					}}>
					<option value=''>{t('filters.all')}</option>
					<option value={String(WatchState.Unseen)}>{t('filters.unseen')}</option>
					<option value={String(WatchState.InProgress)}>{t('filters.inProgress')}</option>
					<option value={String(WatchState.Seen)}>{t('filters.seen')}</option>
				</select>
				<select
					className='state-filter'
					value={sortBy}
					onChange={(e) => {
						setSortBy(e.target.value)
						setPage(1)
					}}>
					<option value='title'>{t('filters.name')}</option>
					<option value='release'>{t('filters.releaseDate')}</option>
					<option value='grade'>{t('filters.grade')}</option>
				</select>
				<button
					className='btn-secondary btn-sm'
					onClick={() => {
						setSortDesc((p) => !p)
						setPage(1)
					}}>
					{sortDesc ? '↓' : '↑'}
				</button>
			</div>

			{error && <div className='error-message'>{error}</div>}

			{loading && <div className='loading-state'>{t('common.loading')}</div>}

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
										<span className='series-card__rating'>★ {s.userRating}</span>
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
