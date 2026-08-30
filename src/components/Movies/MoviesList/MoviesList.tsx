import React, { useEffect, useState, useRef, useCallback } from 'react'
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
	MediaFilterBar,
} from '@/components/elements'
import type { MediaFilterOptionsDto, MediaQueryParameters } from '@/models/api'
import { getMovieFilterOptions } from '@/services/MediaService/MediaService'
import { formatUserRating } from '@/utils'
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
				if (resetPage && !('page' in updates)) {
					next.delete('page')
				}
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
		dispatch(fetchMovies(buildParams()))
	}, [dispatch, buildParams])

	useEffect(() => {
		getMovieFilterOptions(activeProfileId ?? undefined).then(setFilterOptions).catch(() => setFilterOptions({ genres: [], actors: [], directors: [] }))
	}, [activeProfileId])

	useEffect(() => {
		if (!isDataFresh) {
			dispatch(fetchMovies(buildParams()))
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

			{loading && movies.length === 0 && (
				<div className='loading-state'>{t('common.loading')}</div>
			)}

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
									<span className='movie-card__rating'>★ {formatUserRating(m.userRating)}</span>
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
