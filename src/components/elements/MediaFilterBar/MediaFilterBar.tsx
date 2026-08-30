import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MediaFilterOptionsDto } from '@/models/api'
import { WatchState } from '@/models/api/Enums'
import './MediaFilterBar.scss'

interface Props {
	searchInput: string
	stateFilter: string
	sortBy: string
	sortDesc: boolean
	pageSize: number
	genre: string
	actor: string
	director: string
	options: MediaFilterOptionsDto
	onSearchChange: (value: string) => void
	onSearch: (event: React.FormEvent) => void
	onChange: (key: string, value: string | null) => void
}

export const MediaFilterBar: React.FC<Props> = ({
	searchInput,
	stateFilter,
	sortBy,
	sortDesc,
	pageSize,
	genre,
	actor,
	director,
	options,
	onSearchChange,
	onSearch,
	onChange,
}) => {
	const { t } = useTranslation()
	const [filtersOpen, setFiltersOpen] = useState(false)
	const genres = Array.isArray(options.genres) ? options.genres : []
	const actors = Array.isArray(options.actors) ? options.actors : []
	const directors = Array.isArray(options.directors) ? options.directors : []
	const activeFilterCount = [stateFilter, genre, actor, director].filter(Boolean).length

	return (
		<section className='media-filter-bar' aria-label={t('filters.title')}>
			<form className='media-filter-bar__search' onSubmit={onSearch}>
				<label htmlFor='media-search' className='sr-only'>
					{t('common.search')}
				</label>
				<input
					id='media-search'
					type='text'
					className='search-input'
					placeholder={t('common.search')}
					value={searchInput}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
				<button
					type='button'
					className={`media-filter-bar__icon-button ${filtersOpen ? 'media-filter-bar__icon-button--active' : ''}`}
					aria-label={filtersOpen ? t('filters.hide') : t('filters.show')}
					aria-expanded={filtersOpen}
					onClick={() => setFiltersOpen((open) => !open)}>
					<svg viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
						<path d='M4 5h16l-6.5 7v5.5l-3 1.5V12L4 5Z' />
					</svg>
					{activeFilterCount > 0 && <strong>{activeFilterCount}</strong>}
				</button>
			</form>

			<div className={`media-filter-bar__controls ${filtersOpen ? 'media-filter-bar__controls--open' : ''}`} aria-hidden={!filtersOpen}>
				<label className='media-filter-bar__field'>
					<span>{t('filters.status')}</span>
					<select
						className='state-filter'
						value={stateFilter}
						onChange={(e) => onChange('state', e.target.value || null)}>
						<option value=''>{t('filters.all')}</option>
						<option value={String(WatchState.Unseen)}>{t('filters.unseen')}</option>
						<option value={String(WatchState.InProgress)}>{t('filters.inProgress')}</option>
						<option value={String(WatchState.Seen)}>{t('filters.seen')}</option>
					</select>
				</label>

				<label className='media-filter-bar__field'>
					<span>{t('filters.genre')}</span>
					<select
						className='state-filter'
						value={genre}
						onChange={(e) => onChange('genre', e.target.value || null)}>
						<option value=''>{t('filters.allGenres')}</option>
						{genres.map((value) => <option key={value} value={value}>{value}</option>)}
					</select>
				</label>

				<label className='media-filter-bar__field'>
					<span>{t('filters.actor')}</span>
					<select
						className='state-filter'
						value={actor}
						onChange={(e) => onChange('actor', e.target.value || null)}>
						<option value=''>{t('filters.allActors')}</option>
						{actors.map((value) => <option key={value} value={value}>{value}</option>)}
					</select>
				</label>

				<label className='media-filter-bar__field'>
					<span>{t('filters.director')}</span>
					<select
						className='state-filter'
						value={director}
						onChange={(e) => onChange('director', e.target.value || null)}>
						<option value=''>{t('filters.allDirectors')}</option>
						{directors.map((value) => <option key={value} value={value}>{value}</option>)}
					</select>
				</label>

				<label className='media-filter-bar__field media-filter-bar__field--sort'>
					<span>{t('filters.sortBy')}</span>
					<select
						className='state-filter'
						value={sortBy}
						onChange={(e) => onChange('sort', e.target.value)}>
						<option value='title'>{t('filters.name')}</option>
						<option value='release'>{t('filters.releaseDate')}</option>
						<option value='grade'>{t('filters.grade')}</option>
						<option value='top'>{t('filters.top')}</option>
					</select>
				</label>

				<button
					type='button'
					className='btn-secondary btn-sm media-filter-bar__direction'
					aria-label={sortDesc ? t('filters.descending') : t('filters.ascending')}
					onClick={() => onChange('desc', sortDesc ? '0' : '1')}>
					{sortDesc ? '↓' : '↑'}
				</button>

				<label className='media-filter-bar__field media-filter-bar__field--size'>
					<span>{t('filters.pageSize')}</span>
					<select
						className='state-filter'
						value={pageSize}
						onChange={(e) => onChange('size', e.target.value)}>
						<option value={20}>20</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
					</select>
				</label>
			</div>
		</section>
	)
}
