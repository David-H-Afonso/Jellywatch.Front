import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react'
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
import { formatUserRating } from '@/utils'
import { environment } from '@/environments'
import { getExternalSearchLabel, getExternalSearchLink } from '@/utils/externalLinks'
import { getMovies, getSeries } from '@/services/MediaService/MediaService'
import type { ActivityDto, MovieListDto, SeriesListDto } from '@/models/api'
import './Activity.scss'

const DATE_PRESETS = ['all', '7d', '30d', '90d', 'custom'] as const
const SHARE_LIMIT = 10

interface ShareImageItem {
	key: string
	mediaItemId: number | null
	mediaType: MediaType
	title: string
	subtitle: string | null
	dateLabel: string | null
	userRating: number | null
	tmdbRating: number | null
}

interface ShareSearchItem extends ShareImageItem {
	id: number
	typeLabel: string
	externalLink: string | null
}

const getPosterSource = (mediaItemId: number | null) =>
	mediaItemId ? `${environment.baseUrl}${environment.apiRoutes.asset.image(mediaItemId, 'Poster')}` : null

const loadPoster = (src: string | null): Promise<HTMLImageElement | null> =>
	new Promise((resolve) => {
		if (!src) {
			resolve(null)
			return
		}
		const image = new Image()
		image.crossOrigin = 'anonymous'
		image.onload = () => resolve(image)
		image.onerror = () => resolve(null)
		image.src = src
	})

const toActivityShareItem = (item: ActivityDto, locale: string): ShareImageItem => ({
	key: `activity-${item.id}`,
	mediaItemId: item.mediaItemId,
	mediaType: item.mediaType,
	title: item.mediaTitle,
	subtitle: item.episodeName
		? `S${item.seasonNumber}E${item.episodeNumber} · ${item.episodeName}`
		: null,
	dateLabel: new Date(item.timestamp).toLocaleDateString(locale, {
		day: '2-digit',
		month: 'short',
	}),
	userRating: item.userRating,
	tmdbRating: item.tmdbRating,
})

const toMovieShareSearchItem = (movie: MovieListDto): ShareSearchItem => ({
	key: `movie-${movie.id}`,
	id: movie.id,
	mediaItemId: movie.mediaItemId,
	mediaType: MediaType.Movie,
	title: movie.title,
	subtitle: movie.releaseDate ? movie.releaseDate.slice(0, 4) : null,
	dateLabel: null,
	userRating: movie.userRating,
	tmdbRating: movie.tmdbRating,
	typeLabel: 'Movie',
	externalLink: getExternalSearchLink(MediaType.Movie, movie.title),
})

const toSeriesShareSearchItem = (series: SeriesListDto): ShareSearchItem => ({
	key: `series-${series.id}`,
	id: series.id,
	mediaItemId: series.mediaItemId,
	mediaType: MediaType.Series,
	title: series.title,
	subtitle: series.releaseDate ? series.releaseDate.slice(0, 4) : null,
	dateLabel: null,
	userRating: series.userRating,
	tmdbRating: series.tmdbRating,
	typeLabel: 'Series',
	externalLink: getExternalSearchLink(MediaType.Series, series.title),
})

const roundRect = (
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number
) => {
	const r = Math.min(radius, width / 2, height / 2)
	context.beginPath()
	context.moveTo(x + r, y)
	context.arcTo(x + width, y, x + width, y + height, r)
	context.arcTo(x + width, y + height, x, y + height, r)
	context.arcTo(x, y + height, x, y, r)
	context.arcTo(x, y, x + width, y, r)
	context.closePath()
}

const drawWrappedText = (
	context: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
	lineHeight: number,
	maxLines: number
) => {
	const words = text.split(/\s+/)
	const lines: string[] = []
	let line = ''

	words.forEach((word) => {
		const testLine = line ? `${line} ${word}` : word
		if (context.measureText(testLine).width <= maxWidth || !line) {
			line = testLine
			return
		}
		lines.push(line)
		line = word
	})
	if (line) lines.push(line)

	lines.slice(0, maxLines).forEach((currentLine, index) => {
		const isLast = index === maxLines - 1 && lines.length > maxLines
		let renderedLine = currentLine
		if (isLast) {
			while (context.measureText(`${renderedLine}...`).width > maxWidth && renderedLine.length > 1) {
				renderedLine = renderedLine.slice(0, -1)
			}
			renderedLine = `${renderedLine}...`
		}
		context.fillText(renderedLine, x, y + index * lineHeight)
	})
}

const drawImageCover = (
	context: CanvasRenderingContext2D,
	image: HTMLImageElement,
	x: number,
	y: number,
	width: number,
	height: number
) => {
	const imageRatio = image.naturalWidth / image.naturalHeight
	const targetRatio = width / height
	let sourceWidth = image.naturalWidth
	let sourceHeight = image.naturalHeight
	let sourceX = 0
	let sourceY = 0

	if (imageRatio > targetRatio) {
		sourceWidth = image.naturalHeight * targetRatio
		sourceX = (image.naturalWidth - sourceWidth) / 2
	} else {
		sourceHeight = image.naturalWidth / targetRatio
		sourceY = (image.naturalHeight - sourceHeight) / 2
	}

	context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
}

const buildShareImage = async (
	items: ShareImageItem[],
	_locale: string,
	footer: string
): Promise<string> => {
	void _locale
	const cols = Math.min(items.length, 5)
	const rows = Math.ceil(items.length / cols)
	const width = 1200
	const padding = 48
	const gap = items.length <= 3 ? 26 : 18
	const headerHeight = 92
	const footerHeight = 56
	const cardWidth = items.length <= 3 ? 250 : items.length <= 5 ? 196 : 176
	const posterHeight = Math.round(cardWidth * 1.5)
	const infoHeight = 114
	const cardHeight = posterHeight + infoHeight
	const height = padding + headerHeight + rows * cardHeight + (rows - 1) * gap + footerHeight
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	const context = canvas.getContext('2d')
	if (!context) throw new Error('Canvas is not available')

	const gradient = context.createLinearGradient(0, 0, width, height)
	gradient.addColorStop(0, '#111827')
	gradient.addColorStop(0.55, '#16213f')
	gradient.addColorStop(1, '#0b1120')
	context.fillStyle = gradient
	context.fillRect(0, 0, width, height)

	context.fillStyle = '#f8fafc'
	context.font = '700 48px system-ui, -apple-system, Segoe UI, sans-serif'
	context.fillText('Jellywatch', padding, 68)

	const posters = await Promise.all(items.map((item) => loadPoster(getPosterSource(item.mediaItemId))))

	items.forEach((item, index) => {
		const col = index % cols
		const row = Math.floor(index / cols)
		const rowItemCount = Math.min(cols, items.length - row * cols)
		const rowWidth = rowItemCount * cardWidth + (rowItemCount - 1) * gap
		const x = (width - rowWidth) / 2 + col * (cardWidth + gap)
		const y = padding + headerHeight + row * (cardHeight + gap)

		context.save()
		roundRect(context, x, y, cardWidth, cardHeight, 14)
		context.fillStyle = 'rgba(15, 23, 42, 0.84)'
		context.fill()
		context.strokeStyle = 'rgba(255, 255, 255, 0.14)'
		context.stroke()

		const poster = posters[index]
		context.save()
		roundRect(context, x, y, cardWidth, posterHeight, 14)
		context.clip()
		if (poster) {
			drawImageCover(context, poster, x, y, cardWidth, posterHeight)
			const fade = context.createLinearGradient(0, y + posterHeight - 80, 0, y + posterHeight)
			fade.addColorStop(0, 'rgba(15, 23, 42, 0)')
			fade.addColorStop(1, 'rgba(15, 23, 42, 0.72)')
			context.fillStyle = fade
			context.fillRect(x, y + posterHeight - 80, cardWidth, 80)
		} else {
			context.fillStyle = '#1f2937'
			context.fillRect(x, y, cardWidth, posterHeight)
			context.fillStyle = '#94a3b8'
			context.font = '700 28px system-ui, -apple-system, Segoe UI, sans-serif'
			context.textAlign = 'center'
			context.fillText('Jellywatch', x + cardWidth / 2, y + posterHeight / 2)
			context.textAlign = 'start'
		}
		context.restore()

		const pills: { text: string; bg: string }[] = []
		if (item.userRating != null) {
			pills.push({ text: `★ ${formatUserRating(item.userRating)}`, bg: '#facc15' })
		}
		if (item.tmdbRating != null) {
			pills.push({ text: `TMDB ${item.tmdbRating.toFixed(1)}`, bg: '#38bdf8' })
		}
		pills.forEach((pill, pillIndex) => {
			context.font = '800 14px system-ui, -apple-system, Segoe UI, sans-serif'
			const pillWidth = context.measureText(pill.text).width + 22
			const pillX = x + 10
			const pillY = y + 10 + pillIndex * 32
			roundRect(context, pillX, pillY, pillWidth, 28, 14)
			context.fillStyle = 'rgba(15, 23, 42, 0.82)'
			context.fill()
			context.strokeStyle = 'rgba(255, 255, 255, 0.18)'
			context.stroke()
			context.fillStyle = pill.bg
			context.fillText(pill.text, pillX + 11, pillY + 19)
		})

		context.fillStyle = '#f8fafc'
		context.font = '700 17px system-ui, -apple-system, Segoe UI, sans-serif'
		drawWrappedText(context, item.title, x + 14, y + posterHeight + 28, cardWidth - 28, 21, 2)

		if (item.subtitle) {
			context.fillStyle = '#bfdbfe'
			context.font = '600 12px system-ui, -apple-system, Segoe UI, sans-serif'
			drawWrappedText(
				context,
				item.subtitle,
				x + 14,
				y + posterHeight + 76,
				cardWidth - 28,
				16,
				1
			)
		}

		if (item.dateLabel) {
			context.font = '700 13px system-ui, -apple-system, Segoe UI, sans-serif'
			context.fillStyle = 'rgba(248, 250, 252, 0.78)'
			context.fillText(item.dateLabel, x + 14, y + cardHeight - 18)
		}

		context.restore()
	})

	context.fillStyle = 'rgba(226, 232, 240, 0.74)'
	context.font = '600 18px system-ui, -apple-system, Segoe UI, sans-serif'
	context.fillText(footer, padding, height - 26)

	return canvas.toDataURL('image/png')
}

const Activity: React.FC = () => {
	const { t, i18n } = useTranslation()
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
	const [shareMode, setShareMode] = useState(searchParams.get('share') === '1')
	const [selectedIds, setSelectedIds] = useState<number[]>([])
	const [extraShareItems, setExtraShareItems] = useState<ShareSearchItem[]>([])
	const [shareImage, setShareImage] = useState<string | null>(null)
	const [shareBusy, setShareBusy] = useState(false)
	const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
	const [shareSearch, setShareSearch] = useState('')
	const [shareSearchResults, setShareSearchResults] = useState<ShareSearchItem[]>([])
	const [shareSearchLoading, setShareSearchLoading] = useState(false)
	const [shareSearchError, setShareSearchError] = useState<string | null>(null)

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

	const selectedItems = useMemo(
		() => [
			...activity
				.filter((item) => selectedIds.includes(item.id))
				.map((item) => toActivityShareItem(item, i18n.language)),
			...extraShareItems,
		],
		[activity, extraShareItems, i18n.language, selectedIds]
	)

	const toggleShareMode = useCallback(() => {
		setShareMode((current) => {
			const next = !current
			if (!next) {
				setSelectedIds([])
				setExtraShareItems([])
				setShareImage(null)
				setCopyState('idle')
			}
			return next
		})
	}, [])

	const toggleShareItem = useCallback((id: number) => {
		setCopyState('idle')
		setSelectedIds((current) => {
			if (current.includes(id)) return current.filter((itemId) => itemId !== id)
			if (current.length + extraShareItems.length >= SHARE_LIMIT) return current
			return [...current, id]
		})
	}, [extraShareItems.length])

	const selectLatestWatched = useCallback(() => {
		setCopyState('idle')
		setExtraShareItems([])
		setSelectedIds(
			activity
				.filter((item) => item.eventType === 3)
				.slice(0, SHARE_LIMIT)
				.map((item) => item.id)
		)
	}, [activity])

	const addShareSearchItem = useCallback((item: ShareSearchItem) => {
		setCopyState('idle')
		setExtraShareItems((current) => {
			if (current.some((existing) => existing.key === item.key)) return current
			if (current.length + selectedIds.length >= SHARE_LIMIT) return current
			return [...current, item]
		})
	}, [selectedIds.length])

	const removeShareItem = useCallback((key: string) => {
		setCopyState('idle')
		if (key.startsWith('activity-')) {
			const id = Number(key.replace('activity-', ''))
			setSelectedIds((current) => current.filter((itemId) => itemId !== id))
			return
		}
		setExtraShareItems((current) => current.filter((item) => item.key !== key))
	}, [])

	const runShareSearch = useCallback(async () => {
		const query = shareSearch.trim()
		if (query.length < 2) {
			setShareSearchResults([])
			return
		}

		setShareSearchLoading(true)
		setShareSearchError(null)
		try {
			const [movies, series] = await Promise.all([
				getMovies({ search: query, pageSize: 6, profileId: activeProfileId ?? undefined }),
				getSeries({ search: query, pageSize: 6, profileId: activeProfileId ?? undefined }),
			])
			setShareSearchResults([
				...movies.data.map(toMovieShareSearchItem),
				...series.data.map(toSeriesShareSearchItem),
			])
		} catch (error) {
			setShareSearchError(error instanceof Error ? error.message : t('common.error'))
			setShareSearchResults([])
		} finally {
			setShareSearchLoading(false)
		}
	}, [activeProfileId, shareSearch, t])

	const copyShareImage = useCallback(async () => {
		if (!shareImage || !('ClipboardItem' in window) || !navigator.clipboard?.write) {
			setCopyState('failed')
			return
		}

		try {
			const blob = await fetch(shareImage).then((response) => response.blob())
			await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
			setCopyState('copied')
		} catch {
			setCopyState('failed')
		}
	}, [shareImage])

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

	useEffect(() => {
		if (!shareMode || selectedItems.length === 0) {
			setShareImage(null)
			return
		}

		let cancelled = false
		setShareBusy(true)
		buildShareImage(
			selectedItems,
			i18n.language,
			t('activity.share.imageFooter', { defaultValue: 'Hecho con Jellywatch' })
		)
			.then((image) => {
				if (!cancelled) setShareImage(image)
			})
			.catch(() => {
				if (!cancelled) setShareImage(null)
			})
			.finally(() => {
				if (!cancelled) setShareBusy(false)
			})

		return () => {
			cancelled = true
		}
	}, [shareMode, selectedItems, i18n.language])

	const getItemLink = (item: (typeof activity)[0]) => {
		if (item.mediaType === MediaType.Movie && item.movieId) return `/movies/${item.movieId}`
		if (item.seriesId) return `/series/${item.seriesId}`
		return null
	}

	return (
		<div className='activity-page'>
			<div className='activity-page__header'>
				<h1>{t('activity.title')}</h1>
				<div className='activity-page__header-actions'>
					<button className='activity-page__share-toggle' onClick={toggleShareMode}>
						{shareMode ? t('activity.share.exit') : t('activity.share.open')}
					</button>
					<ProfileSelector />
				</div>
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

			{shareMode && (
				<div className='activity-page__share-panel'>
					<div className='activity-page__share-tools'>
						<div>
							<strong>{t('activity.share.title')}</strong>
							<span>{t('activity.share.count', { count: selectedItems.length, limit: SHARE_LIMIT })}</span>
						</div>
						<div className='activity-page__share-actions'>
							<button onClick={selectLatestWatched}>{t('activity.share.latest')}</button>
							<button
								onClick={() => {
									setSelectedIds([])
									setExtraShareItems([])
								}}
								disabled={selectedItems.length === 0}>
								{t('activity.share.clear')}
							</button>
						</div>
					</div>
					<div className='activity-page__share-search'>
						<input
							type='text'
							value={shareSearch}
							placeholder={t('activity.share.searchPlaceholder', {
								defaultValue: 'Buscar cualquier peli o serie de tu biblioteca...',
							})}
							onChange={(event) => setShareSearch(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === 'Enter') runShareSearch()
							}}
						/>
						<button onClick={runShareSearch} disabled={shareSearchLoading || shareSearch.trim().length < 2}>
							{shareSearchLoading ? t('common.loading') : t('common.search')}
						</button>
					</div>
					{shareSearchError && <p className='activity-page__share-hint'>{shareSearchError}</p>}
					{shareSearchResults.length > 0 && (
						<div className='activity-page__share-results'>
							{shareSearchResults.map((result) => {
								const alreadySelected = selectedItems.some((item) => item.key === result.key)
								const disabled = !alreadySelected && selectedItems.length >= SHARE_LIMIT
								return (
									<div key={result.key} className='activity-page__share-result'>
										<MediaPoster
											mediaItemId={result.mediaItemId}
											alt={result.title}
											className='activity-page__share-result-poster'
										/>
										<div>
											<strong>{result.title}</strong>
											<span>
												{result.mediaType === MediaType.Movie
													? t('movies.title')
													: t('series.title')}
												{result.subtitle ? ` · ${result.subtitle}` : ''}
											</span>
										</div>
										<button
											onClick={() =>
												alreadySelected
													? removeShareItem(result.key)
													: addShareSearchItem(result)
											}
											disabled={disabled}>
											{alreadySelected ? t('common.remove') : t('common.add')}
										</button>
									</div>
								)
							})}
						</div>
					)}
					{selectedItems.length > 0 && (
						<div className='activity-page__share-selected'>
							{selectedItems.map((item) => (
								<button key={item.key} onClick={() => removeShareItem(item.key)}>
									{item.title} ×
								</button>
							))}
						</div>
					)}
					{selectedItems.length === 0 && (
						<p className='activity-page__share-hint'>{t('activity.share.hint')}</p>
					)}
					{shareBusy && <p className='activity-page__share-hint'>{t('activity.share.generating')}</p>}
					{shareImage && (
						<div className='activity-page__share-preview'>
							<img src={shareImage} alt={t('activity.share.previewAlt')} />
							<div className='activity-page__share-copy'>
								<button onClick={copyShareImage}>{t('activity.share.copy')}</button>
								{copyState === 'copied' && <span>{t('activity.share.copied')}</span>}
								{copyState === 'failed' && <span>{t('activity.share.copyFallback')}</span>}
							</div>
						</div>
					)}
				</div>
			)}

			{loading && <div className='loading-state'>{t('common.loading')}</div>}

			{!loading && error && <p className='error-state'>{error}</p>}

			{!loading && !error && activity.length === 0 && (
				<p className='empty-state'>{t('dashboard.noActivity')}</p>
			)}

			<div className='activity-page__list'>
				{activity.map((item) => {
					const link = getItemLink(item)
					const externalLink = getExternalSearchLink(item.mediaType, item.mediaTitle)
					const isSelected = selectedIds.includes(item.id)
					return (
						<div
							key={item.id}
							className={`activity-page__item ${isSelected ? 'activity-page__item--selected' : ''}`}>
							{shareMode && (
								<button
									className='activity-page__select-btn'
									onClick={() => toggleShareItem(item.id)}
									aria-pressed={isSelected}
									disabled={!isSelected && selectedItems.length >= SHARE_LIMIT}>
									{isSelected ? '✓' : '+'}
								</button>
							)}
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
											★ {formatUserRating(item.userRating)}
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
							{externalLink && (
								<a
									className='activity-page__external-link'
									href={externalLink}
									target='_blank'
									rel='noreferrer'
									title={getExternalSearchLabel(item.mediaType)}>
									{getExternalSearchLabel(item.mediaType)}
								</a>
							)}
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
