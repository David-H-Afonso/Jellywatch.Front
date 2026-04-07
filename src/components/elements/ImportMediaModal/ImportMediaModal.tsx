import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { searchTmdb, addManually } from '@/services/MediaService/MediaService'
import type { TmdbTvSearchResultDto, TmdbMovieSearchResultDto } from '@/models/api'
import './ImportMediaModal.scss'

type MediaTypeOption = 'series' | 'movie'
type SearchResult = TmdbTvSearchResultDto | TmdbMovieSearchResultDto

function isTvResult(r: SearchResult): r is TmdbTvSearchResultDto {
	return 'name' in r
}

interface Props {
	profileId: number
	defaultType?: MediaTypeOption
	onClose: () => void
	onAdded: () => void
}

export const ImportMediaModal: React.FC<Props> = ({
	profileId,
	defaultType = 'series',
	onClose,
	onAdded,
}) => {
	const { t } = useTranslation()

	const [mode, setMode] = useState<'search' | 'id'>('search')
	const [mediaType, setMediaType] = useState<MediaTypeOption>(defaultType)
	const [query, setQuery] = useState('')
	const [year, setYear] = useState('')
	const [tmdbIdInput, setTmdbIdInput] = useState('')
	const [results, setResults] = useState<SearchResult[]>([])
	const [searching, setSearching] = useState(false)
	const [addingId, setAddingId] = useState<number | null>(null)
	const [addedIds, setAddedIds] = useState<Set<number>>(new Set())
	const [error, setError] = useState<string | null>(null)
	const [idSuccess, setIdSuccess] = useState(false)

	const handleTypeChange = (newType: MediaTypeOption) => {
		setMediaType(newType)
		setResults([])
		setError(null)
		setIdSuccess(false)
	}

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!query.trim()) return
		setSearching(true)
		setError(null)
		setResults([])
		try {
			const data = await searchTmdb(query.trim(), mediaType, year ? Number(year) : undefined)
			setResults(data)
		} catch {
			setError(t('common.error'))
		} finally {
			setSearching(false)
		}
	}

	const handleAdd = async (tmdbId: number): Promise<boolean> => {
		setAddingId(tmdbId)
		setError(null)
		try {
			await addManually({ tmdbId, type: mediaType, profileId })
			setAddedIds((prev) => new Set(prev).add(tmdbId))
			onAdded()
			return true
		} catch {
			setError(t('common.error'))
			return false
		} finally {
			setAddingId(null)
		}
	}

	const handleAddById = async (e: React.FormEvent) => {
		e.preventDefault()
		const id = Number(tmdbIdInput.trim())
		if (!id || isNaN(id)) return
		const success = await handleAdd(id)
		if (success) {
			setTmdbIdInput('')
			setIdSuccess(true)
		}
	}

	const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) onClose()
	}

	return (
		<div className='import-overlay' onClick={handleOverlayClick}>
			<div className='import-modal'>
				<div className='import-modal__header'>
					<h2>{t('import.title')}</h2>
					<button className='import-modal__close' onClick={onClose} aria-label={t('common.close')}>
						✕
					</button>
				</div>

				<div className='import-modal__body'>
					{/* Type + mode tabs row */}
					<div className='import-modal__controls'>
						<div className='import-modal__tabs'>
							<button
								className={`import-modal__tab ${mediaType === 'series' ? 'import-modal__tab--active' : ''}`}
								onClick={() => handleTypeChange('series')}>
								📺 {t('import.series')}
							</button>
							<button
								className={`import-modal__tab ${mediaType === 'movie' ? 'import-modal__tab--active' : ''}`}
								onClick={() => handleTypeChange('movie')}>
								🎬 {t('import.movie')}
							</button>
						</div>
						<div className='import-modal__tabs import-modal__tabs--mode'>
							<button
								className={`import-modal__tab ${mode === 'search' ? 'import-modal__tab--active' : ''}`}
								onClick={() => setMode('search')}>
								{t('import.searchByName')}
							</button>
							<button
								className={`import-modal__tab ${mode === 'id' ? 'import-modal__tab--active' : ''}`}
								onClick={() => setMode('id')}>
								{t('import.addById')}
							</button>
						</div>
					</div>

					{error && <div className='import-modal__error'>{error}</div>}

					{/* Search by name */}
					{mode === 'search' && (
						<>
							<form className='import-modal__search-form' onSubmit={handleSearch}>
								<input
									type='text'
									className='import-modal__input'
									placeholder={t('import.searchPlaceholder')}
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									autoFocus
								/>
								<input
									type='number'
									className='import-modal__input import-modal__input--year'
									placeholder={t('import.year')}
									value={year}
									onChange={(e) => setYear(e.target.value)}
									min='1900'
									max='2100'
								/>
								<button type='submit' className='btn-primary' disabled={searching || !query.trim()}>
									{searching ? t('import.searching') : t('import.searchButton')}
								</button>
							</form>

							{!searching && results.length === 0 && query && (
								<p className='import-modal__empty'>{t('common.noResults')}</p>
							)}

							<div className='import-modal__results'>
								{results.map((result) => {
									const isTv = isTvResult(result)
									const title = isTv ? result.name : result.title
									const releaseYear = isTv
										? result.first_air_date?.slice(0, 4)
										: result.release_date?.slice(0, 4)
									const posterPath = result.poster_path
									const isAdding = addingId === result.id
									const isAdded = addedIds.has(result.id)

									return (
										<div
											key={result.id}
											className={`import-result ${isAdded ? 'import-result--added' : ''}`}>
											<div className='import-result__poster'>
												{posterPath ? (
													<img
														src={`https://image.tmdb.org/t/p/w185${posterPath}`}
														alt={title ?? ''}
														loading='lazy'
													/>
												) : (
													<div className='import-result__no-poster'>{isTv ? '📺' : '🎬'}</div>
												)}
											</div>
											<div className='import-result__info'>
												<h4 className='import-result__title'>{title}</h4>
												<div className='import-result__meta'>
													{releaseYear && <span>{releaseYear}</span>}
													{result.vote_average > 0 && (
														<span>★ {result.vote_average.toFixed(1)}</span>
													)}
												</div>
												{result.overview && (
													<p className='import-result__overview'>{result.overview}</p>
												)}
											</div>
											<button
												className={`import-result__btn ${isAdded ? 'import-result__btn--added' : 'btn-primary'}`}
												onClick={() => !isAdded && handleAdd(result.id)}
												disabled={isAdding || isAdded}>
												{isAdded
													? t('import.added')
													: isAdding
														? t('import.adding')
														: t('import.add')}
											</button>
										</div>
									)
								})}
							</div>
						</>
					)}

					{/* Add by TMDB ID */}
					{mode === 'id' && (
						<form className='import-modal__id-form' onSubmit={handleAddById}>
							<input
								type='number'
								className='import-modal__input'
								placeholder={t('import.tmdbIdPlaceholder')}
								value={tmdbIdInput}
								onChange={(e) => {
									setTmdbIdInput(e.target.value)
									setIdSuccess(false)
								}}
								autoFocus
								min='1'
							/>
							<button
								type='submit'
								className='btn-primary'
								disabled={addingId !== null || !tmdbIdInput.trim()}>
								{addingId !== null ? t('import.adding') : t('import.confirm')}
							</button>
							{idSuccess && <span className='import-modal__success'>{t('import.added')} ✓</span>}
						</form>
					)}
				</div>
			</div>
		</div>
	)
}
