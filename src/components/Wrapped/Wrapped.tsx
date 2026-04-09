import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectActiveProfileId } from '@/store/features/auth/selector'
import { getWrapped } from '@/services/StatsService/StatsService'
import { MediaPoster } from '@/components/elements'
import type { WrappedDto, GenreBreakdownDto } from '@/models/api'
import './Wrapped.scss'
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

const Wrapped: React.FC = () => {
	const { t, i18n } = useTranslation()
	const activeProfileId = useAppSelector(selectActiveProfileId)
	const [data, setData] = useState<WrappedDto | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [year, setYear] = useState(new Date().getFullYear())
	const [expandedMonth, setExpandedMonth] = useState<number | null>(null)
	const [genreView, setGenreView] = useState<'combined' | 'series' | 'movies'>('combined')
	const [hoveredGenre, setHoveredGenre] = useState<GenreBreakdownDto | null>(null)

	useEffect(() => {
		if (!activeProfileId) return
		setLoading(true)
		setError(null)
		getWrapped(activeProfileId, year)
			.then(setData)
			.catch(() => setError(t('common.error')))
			.finally(() => setLoading(false))
	}, [activeProfileId, year, t])

	const formatHours = (minutes: number) => {
		const h = Math.floor(minutes / 60)
		const m = minutes % 60
		return h > 0 ? `${h}h ${m}m` : `${m}m`
	}

	const getMonthName = (monthNum: number) => {
		return t(`wrapped.months.${MONTH_KEYS[monthNum - 1]}`)
	}

	const GENRE_COLORS = [
		'#e74c3c',
		'#3498db',
		'#2ecc71',
		'#f39c12',
		'#9b59b6',
		'#1abc9c',
		'#e67e22',
		'#e91e63',
		'#00bcd4',
		'#8bc34a',
		'#ff5722',
		'#607d8b',
	]

	const buildDonutPaths = useCallback(
		(genres: GenreBreakdownDto[], mode: 'combined' | 'series' | 'movies') => {
			const getCount = (g: GenreBreakdownDto) =>
				mode === 'series' ? g.seriesCount : mode === 'movies' ? g.movieCount : g.totalCount
			const total = genres.reduce((acc, g) => acc + getCount(g), 0)
			if (total === 0) return []
			const paths: { d: string; color: string; genre: GenreBreakdownDto; pct: number }[] = []
			let cumulative = 0
			const cx = 50,
				cy = 50,
				r = 40
			for (let i = 0; i < genres.length; i++) {
				const count = getCount(genres[i])
				if (count === 0) continue
				const pct = count / total
				const startAngle = cumulative * 2 * Math.PI - Math.PI / 2
				cumulative += pct
				const endAngle = cumulative * 2 * Math.PI - Math.PI / 2
				const largeArc = pct > 0.5 ? 1 : 0
				const x1 = cx + r * Math.cos(startAngle)
				const y1 = cy + r * Math.sin(startAngle)
				const x2 = cx + r * Math.cos(endAngle)
				const y2 = cy + r * Math.sin(endAngle)
				const d =
					pct >= 1
						? `M ${cx},${cy - r} A ${r},${r} 0 1,1 ${cx - 0.001},${cy - r} Z`
						: `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`
				paths.push({ d, color: GENRE_COLORS[i % GENRE_COLORS.length], genre: genres[i], pct })
			}
			return paths
		},
		[]
	)

	const maxBarValue = data
		? Math.max(...data.monthlyActivity.map((m) => m.episodeCount + m.movieCount), 1)
		: 1

	if (loading) {
		return <div className='loading-state'>{t('common.loading')}</div>
	}

	if (error) {
		return <div className='error-state'>{error}</div>
	}

	const isEmpty = !data || (data.totalEpisodesWatched === 0 && data.totalMoviesWatched === 0)

	return (
		<div className='wrapped'>
			<div className='wrapped__header'>
				<h1>{t('wrapped.title')}</h1>
				<div className='wrapped__year-selector'>
					<button onClick={() => setYear((y) => y - 1)}>←</button>
					<span className='wrapped__year'>{year}</span>
					<button onClick={() => setYear((y) => y + 1)} disabled={year >= new Date().getFullYear()}>
						→
					</button>
				</div>
			</div>

			{isEmpty ? (
				<div className='wrapped__empty'>
					<p>{t('wrapped.noData')}</p>
				</div>
			) : (
				<>
					{/* Hero stats */}
					<div className='wrapped__hero'>
						<div className='stat-card stat-card--hero'>
							<span className='stat-card__value'>{data!.totalEpisodesWatched}</span>
							<span className='stat-card__label'>{t('wrapped.episodes')}</span>
						</div>
						<div className='stat-card stat-card--hero'>
							<span className='stat-card__value'>{data!.totalMoviesWatched}</span>
							<span className='stat-card__label'>{t('wrapped.movies')}</span>
						</div>
						<div className='stat-card stat-card--hero'>
							<span className='stat-card__value'>{data!.totalSeriesWatched}</span>
							<span className='stat-card__label'>{t('wrapped.series')}</span>
						</div>
						<div className='stat-card stat-card--hero'>
							<span className='stat-card__value'>{formatHours(data!.totalMinutesWatched)}</span>
							<span className='stat-card__label'>{t('wrapped.watchTime')}</span>
						</div>
						<div className='stat-card stat-card--hero'>
							<span className='stat-card__value'>{data!.totalDaysActive}</span>
							<span className='stat-card__label'>{t('wrapped.daysActive')}</span>
						</div>
						<div className='stat-card stat-card--hero'>
							<span className='stat-card__value'>{data!.longestStreakDays}</span>
							<span className='stat-card__label'>{t('wrapped.longestStreak')}</span>
						</div>
					</div>

					{/* Busiest day */}
					{data!.busiestDay && (
						<p className='wrapped__highlight'>
							{t('wrapped.busiestDay', {
								date: new Date(data!.busiestDay + 'T00:00:00').toLocaleDateString(undefined, {
									day: 'numeric',
									month: 'long',
								}),
								count: data!.busiestDayCount,
							})}
						</p>
					)}

					{/* Monthly chart */}
					<section className='wrapped__section'>
						<h2>{t('wrapped.monthlyActivity')}</h2>
						<div className='wrapped__chart'>
							{data!.monthlyActivity.map((m) => {
								const total = m.episodeCount + m.movieCount
								const pct = (total / maxBarValue) * 100
								return (
									<div
										key={m.month}
										className={`chart-bar ${expandedMonth === m.month ? 'chart-bar--active' : ''}`}
										onClick={() => setExpandedMonth(expandedMonth === m.month ? null : m.month)}>
										<div className='chart-bar__fill' style={{ height: `${pct}%` }}>
											{total > 0 && <span className='chart-bar__count'>{total}</span>}
										</div>
										<span className='chart-bar__label'>{getMonthName(m.month).slice(0, 3)}</span>
									</div>
								)
							})}
						</div>
						{data!.mostActiveMonth && (
							<p className='wrapped__highlight'>
								{t('wrapped.mostActiveMonth', {
									month: getMonthName(Number(data!.mostActiveMonth)),
									count: data!.mostActiveMonthCount,
								})}
							</p>
						)}
					</section>

					{/* Month detail (expanded) */}
					{expandedMonth &&
						(() => {
							const m = data!.monthlyActivity.find((a) => a.month === expandedMonth)
							if (!m || (m.episodeCount === 0 && m.movieCount === 0)) return null
							return (
								<section className='wrapped__section wrapped__month-detail'>
									<h2>
										{getMonthName(m.month)} {year}
									</h2>
									<p className='wrapped__month-summary'>
										{m.episodeCount} {t('wrapped.episodes')} · {m.movieCount} {t('wrapped.movies')}{' '}
										· {formatHours(m.minutesWatched)}
									</p>
									{m.series.length > 0 && (
										<div className='wrapped__month-list'>
											<h3>{t('wrapped.seriesWatched')}</h3>
											{m.series.map((s) => (
												<div key={s.mediaItemId} className='wrapped__month-series'>
													<div className='wrapped__month-series-header'>
														<Link to={`/series/${s.mediaItemId}`}>
															<MediaPoster
																mediaItemId={s.mediaItemId}
																alt={s.title}
																className='wrapped__month-poster'
															/>
														</Link>
														<div className='wrapped__month-info'>
															<span className='wrapped__month-title'>{s.title}</span>
															<span className='wrapped__month-meta'>
																{s.episodeCount} {t('wrapped.episodes')}
															</span>
														</div>
													</div>
													{s.episodes.length > 0 && (
														<div className='wrapped__month-episodes'>
															{s.episodes.map((ep, idx) => (
																<div key={idx} className='wrapped__month-episode'>
																	<span className='wrapped__month-episode-label'>
																		S{ep.seasonNumber}E{ep.episodeNumber}
																		{ep.episodeName ? ` — ${ep.episodeName}` : ''}
																	</span>
																	<span className='wrapped__month-episode-date'>
																		{(() => {
																			const d = new Date(ep.watchedAt)
																			return `${d.getDate()} ${d.toLocaleDateString(i18n.language, { month: 'short' })}, ${d.getFullYear()}`
																		})()}
																	</span>
																</div>
															))}
														</div>
													)}
												</div>
											))}
										</div>
									)}
									{m.movies.length > 0 && (
										<div className='wrapped__month-list'>
											<h3>{t('wrapped.moviesWatched')}</h3>
											{m.movies.map((mv) => (
												<div key={mv.mediaItemId} className='wrapped__month-item'>
													<Link to={`/movies/${mv.mediaItemId}`}>
														<MediaPoster
															mediaItemId={mv.mediaItemId}
															alt={mv.title}
															className='wrapped__month-poster'
														/>
													</Link>
													<div className='wrapped__month-info'>
														<span className='wrapped__month-title'>{mv.title}</span>
														<div className='wrapped__month-movie-meta'>
															<span className='wrapped__month-movie-date'>
																{(() => {
																	const d = new Date(mv.watchedAt)
																	return `${d.getDate()} ${d.toLocaleDateString(i18n.language, { month: 'long' })}, ${d.getFullYear()}`
																})()}
															</span>
															{mv.releaseDate && (
																<span className='wrapped__month-movie-release'>
																	{new Date(mv.releaseDate + 'T00:00:00').getFullYear()}
																</span>
															)}
															{mv.userRating != null && (
																<span className='wrapped__month-rating wrapped__month-rating--user'>
																	★ {(mv.userRating / 2).toFixed(1)}
																</span>
															)}
															{mv.userRating == null && mv.tmdbRating != null && (
																<span className='wrapped__month-rating wrapped__month-rating--tmdb'>
																	★ {mv.tmdbRating.toFixed(1)}
																</span>
															)}
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</section>
							)
						})()}

					{/* First watch */}
					{data!.firstWatch && (
						<section className='wrapped__section'>
							<h2>{t('wrapped.firstWatch')}</h2>
							<div className='wrapped__first-watch'>
								<Link
									to={`/${data!.firstWatch.mediaType === 'Movie' ? 'movies' : 'series'}/${data!.firstWatch.mediaItemId}`}>
									<MediaPoster
										mediaItemId={data!.firstWatch.mediaItemId}
										alt={data!.firstWatch.title}
										className='wrapped__first-poster'
									/>
								</Link>
								<div className='wrapped__first-info'>
									<span className='wrapped__first-title'>{data!.firstWatch.title}</span>
									<div className='wrapped__first-meta'>
										{data!.firstWatch.releaseDate && (
											<span className='wrapped__first-year'>
												{new Date(data!.firstWatch.releaseDate + 'T00:00:00').getFullYear()}
											</span>
										)}
										<span className='wrapped__first-date'>
											{(() => {
												const d = new Date(data!.firstWatch.timestamp)
												return `${d.getDate()} ${d.toLocaleDateString(i18n.language, { month: 'short' })}, ${d.getFullYear()}`
											})()}
										</span>
										{data!.firstWatch.userRating != null && (
											<span className='wrapped__list-rating wrapped__list-rating--user'>
												★ {(data!.firstWatch.userRating / 2).toFixed(1)}
											</span>
										)}
										{data!.firstWatch.userRating == null && data!.firstWatch.tmdbRating != null && (
											<span className='wrapped__list-rating wrapped__list-rating--tmdb'>
												★ {data!.firstWatch.tmdbRating.toFixed(1)}
											</span>
										)}
									</div>
								</div>
							</div>
						</section>
					)}

					{/* Top series */}
					{data!.topSeries.length > 0 && (
						<section className='wrapped__section'>
							<h2>{t('wrapped.topSeries')}</h2>
							<div className='wrapped__list'>
								{data!.topSeries.map((s, i) => (
									<div key={s.mediaItemId} className='wrapped__list-item'>
										<span className='wrapped__rank'>#{i + 1}</span>
										<Link to={`/series/${s.mediaItemId}`}>
											<MediaPoster
												mediaItemId={s.mediaItemId}
												alt={s.title}
												className='wrapped__list-poster'
											/>
										</Link>
										<div className='wrapped__list-info'>
											<span className='wrapped__list-title'>{s.title}</span>
											<span className='wrapped__list-meta'>
												{s.episodesWatched} {t('wrapped.episodes')} ·{' '}
												{formatHours(s.minutesWatched)}
												{s.userRating != null && (
													<span className='wrapped__list-rating wrapped__list-rating--user'>
														{' '}
														· ★ {(s.userRating / 2).toFixed(1)}
													</span>
												)}
												{s.userRating == null && s.tmdbRating != null && (
													<span className='wrapped__list-rating wrapped__list-rating--tmdb'>
														{' '}
														· ★ {s.tmdbRating.toFixed(1)}
													</span>
												)}
											</span>
										</div>
									</div>
								))}
							</div>
						</section>
					)}

					{/* Top movies */}
					{data!.topMovies.length > 0 && (
						<section className='wrapped__section'>
							<h2>{t('wrapped.topMovies')}</h2>
							<div className='wrapped__list'>
								{data!.topMovies.map((m, i) => (
									<div key={m.mediaItemId} className='wrapped__list-item'>
										<span className='wrapped__rank'>#{i + 1}</span>
										<Link to={`/movies/${m.mediaItemId}`}>
											<MediaPoster
												mediaItemId={m.mediaItemId}
												alt={m.title}
												className='wrapped__list-poster'
											/>
										</Link>
										<div className='wrapped__list-info'>
											<span className='wrapped__list-title'>{m.title}</span>
											<span className='wrapped__list-meta'>
												{m.releaseDate &&
													`${new Date(m.releaseDate + 'T00:00:00').getFullYear()} · `}
												{(() => {
													const d = new Date(m.watchedAt)
													return `${d.getDate()} ${d.toLocaleDateString(i18n.language, { month: 'short' })}, ${d.getFullYear()}`
												})()}
												{m.userRating != null && (
													<span className='wrapped__list-rating wrapped__list-rating--user'>
														{' '}
														· ★ {(m.userRating / 2).toFixed(1)}
													</span>
												)}
												{m.userRating == null && m.tmdbRating != null && (
													<span className='wrapped__list-rating wrapped__list-rating--tmdb'>
														{' '}
														· ★ {m.tmdbRating.toFixed(1)}
													</span>
												)}
											</span>
										</div>
									</div>
								))}
							</div>
						</section>
					)}

					{/* Top networks */}
					{data!.topNetworks.length > 0 && (
						<section className='wrapped__section'>
							<h2>{t('wrapped.topNetworks')}</h2>
							<div className='wrapped__networks'>
								{data!.topNetworks.map((n) => (
									<div key={n.network} className='wrapped__network-tag'>
										<span className='wrapped__network-name'>{n.network}</span>
										<span className='wrapped__network-count'>
											{n.count} {t('wrapped.episodes')}
										</span>
									</div>
								))}
							</div>
						</section>
					)}

					{/* Genre breakdown */}
					{data!.genreBreakdown.length > 0 && (
						<section className='wrapped__section'>
							<h2>{t('wrapped.genres')}</h2>
							<div className='wrapped__genre-tabs'>
								{(['combined', 'series', 'movies'] as const).map((mode) => (
									<button
										key={mode}
										className={`wrapped__genre-tab ${genreView === mode ? 'wrapped__genre-tab--active' : ''}`}
										onClick={() => setGenreView(mode)}>
										{t(`wrapped.genre${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
									</button>
								))}
							</div>
							<div className='wrapped__genre-chart'>
								<svg viewBox='0 0 100 100' className='wrapped__donut'>
									{buildDonutPaths(data!.genreBreakdown, genreView).map((seg, i) => (
										<path
											key={i}
											d={seg.d}
											fill={seg.color}
											stroke='var(--color-bg)'
											strokeWidth='0.5'
											onMouseEnter={() => setHoveredGenre(seg.genre)}
											onMouseLeave={() => setHoveredGenre(null)}
											className='wrapped__donut-segment'
										/>
									))}
								</svg>
								{hoveredGenre && (
									<div className='wrapped__genre-tooltip'>
										<strong>{hoveredGenre.genre}</strong>
										<span>
											{genreView === 'combined'
												? `${hoveredGenre.totalCount} ${t('wrapped.episodes')} + ${t('wrapped.movies').toLowerCase()}`
												: genreView === 'series'
													? `${hoveredGenre.seriesCount} ${t('wrapped.episodes')}`
													: `${hoveredGenre.movieCount} ${t('wrapped.movies')}`}
										</span>
										<span>{formatHours(hoveredGenre.minutesWatched)}</span>
										{hoveredGenre.titles.length > 0 && (
											<div className='wrapped__genre-tooltip-titles'>
												{hoveredGenre.titles.map((title) => (
													<span key={title}>{title}</span>
												))}
											</div>
										)}
									</div>
								)}
								<div className='wrapped__genre-legend'>
									{data!.genreBreakdown.map((g, i) => (
										<div
											key={g.genre}
											className='wrapped__genre-legend-item'
											onMouseEnter={() => setHoveredGenre(g)}
											onMouseLeave={() => setHoveredGenre(null)}>
											<span
												className='wrapped__genre-legend-dot'
												style={{ background: GENRE_COLORS[i % GENRE_COLORS.length] }}
											/>
											<span>{g.genre}</span>
											<span className='wrapped__genre-legend-count'>
												{genreView === 'combined'
													? g.totalCount
													: genreView === 'series'
														? g.seriesCount
														: g.movieCount}
											</span>
										</div>
									))}
								</div>
							</div>
						</section>
					)}

					{/* Monthly genre insights */}
					{data!.monthlyGenreInsights.length > 0 && (
						<section className='wrapped__section'>
							<h2>{t('wrapped.genreInsights')}</h2>
							<div className='wrapped__genre-insights'>
								{data!.monthlyGenreInsights.map((insight) => (
									<div key={insight.month} className='wrapped__genre-insight'>
										<span className='wrapped__genre-insight-month'>
											{getMonthName(insight.month)}
										</span>
										<span className='wrapped__genre-insight-genre'>{insight.topGenre}</span>
										<span className='wrapped__genre-insight-count'>
											{insight.count} {t('wrapped.titles')}
										</span>
									</div>
								))}
							</div>
						</section>
					)}
				</>
			)}
		</div>
	)
}

export default Wrapped
