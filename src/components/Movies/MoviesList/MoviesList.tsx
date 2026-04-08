import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectActiveProfileId } from '@/store/features/auth/selector'
import {
	selectMovies,
	selectMoviesLoading,
	selectMoviesError,
	selectMoviesPagination,
	selectMoviesIsDataFresh,
	fetchMovies,
	invalidateMovieCache,
} from '@/store/features/movies'
import {
	WatchStateBadge,
	Pagination,
	MediaPoster,
	ProfileSelector,
	ImportMediaModal,
} from '@/components/elements'
import type { MediaQueryParameters } from '@/models/api'
import { WatchState } from '@/models/api/Enums'
import './MoviesList.scss'

const MoviesList: React.FC = () => {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const movies = useAppSelector(selectMovies)
	const loading = useAppSelector(selectMoviesLoading)
	const error = useAppSelector(selectMoviesError)
	const pagination = useAppSelector(selectMoviesPagination)
	const isDataFresh = useAppSelector(selectMoviesIsDataFresh)
	const activeProfileId = useAppSelector(selectActiveProfileId)

	const [searchParams, setSearchParams] = useSearchParams()
	const [search, setSearch] = useState('')
	const [stateFilter, setStateFilter] = useState<string>('')
	const [sortBy, setSortBy] = useState('title')
	const [sortDesc, setSortDesc] = useState(false)
	const [importOpen, setImportOpen] = useState(false)
	const [pageSize, setPageSize] = useState(20)

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
		const params: MediaQueryParameters = { page, pageSize, sortBy, sortDescending: sortDesc }
		if (search) params.search = search
		if (stateFilter) params.state = stateFilter
		if (activeProfileId) params.profileId = activeProfileId
		return params
	}, [page, search, stateFilter, sortBy, sortDesc, activeProfileId, pageSize])

	useEffect(() => {
		dispatch(fetchMovies(buildParams()))
	}, [dispatch, buildParams])

	useEffect(() => {
		if (!isDataFresh) {
			dispatch(fetchMovies(buildParams()))
		}
	}, [dispatch, isDataFresh, buildParams])

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		setPage(1)
		dispatch(fetchMovies(buildParams()))
	}

	const handlePageChange = (newPage: number) => {
		setPage(newPage)
	}

	const handleAdded = () => {
		dispatch(invalidateMovieCache())
	}

	return (
		<div className='movies-list-page'>
			<div className='movies-list-page__header'>
				<h1>{t('movies.title')}</h1>
				<div className='movies-list-page__header-actions'>
					<ProfileSelector />
					{activeProfileId != null && (
						<button className='btn-primary btn-sm' onClick={() => setImportOpen(true)}>
							{t('import.title')}
						</button>
					)}
				</div>
			</div>

			<div className='movies-list-page__filters'>
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
				<select
					className='state-filter'
					value={pageSize}
					onChange={(e) => {
						setPageSize(Number(e.target.value))
						setPage(1)
					}}>
					<option value={20}>20</option>
					<option value={50}>50</option>
					<option value={100}>100</option>
				</select>
			</div>

			{error && <div className='error-message'>{error}</div>}

			{loading && <div className='loading-state'>{t('common.loading')}</div>}

			{!loading && movies.length === 0 && <div className='empty-state'>{t('movies.noMovies')}</div>}

			<div className='movies-grid'>
				{movies.map((m) => (
					<Link key={m.id} to={`/movies/${m.id}`} className='movie-card'>
						<MediaPoster
							mediaItemId={m.mediaItemId}
							alt={m.title}
							className='movie-card__poster'
							fallback='🎬'
						/>
						<div className='movie-card__info'>
							<h3 className='movie-card__title'>{m.title}</h3>
							<div className='movie-card__meta'>
								{m.releaseDate && <span>{new Date(m.releaseDate).getFullYear()}</span>}
								{m.runtime != null && (
									<span>
										{m.runtime} {t('movies.minutes')}
									</span>
								)}
							</div>
							<div className='movie-card__footer'>
								<WatchStateBadge state={m.state} size='sm' />
								{m.userRating != null && (
									<span className='movie-card__rating'>★ {(m.userRating / 2).toFixed(1)}</span>
								)}
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
					defaultType='movie'
					onClose={() => setImportOpen(false)}
					onAdded={handleAdded}
				/>
			)}
		</div>
	)
}

export default MoviesList
