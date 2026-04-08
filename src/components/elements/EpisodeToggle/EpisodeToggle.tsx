import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { WatchState } from '@/models/api/Enums'
import './EpisodeToggle.scss'

interface Props {
	state: WatchState
	isManualOverride: boolean
	onToggle: (newState: WatchState, timestamp?: string) => void
	disabled?: boolean
	airDate?: string | null
}

const SeenIcon = () => (
	<svg
		viewBox='0 0 24 24'
		width='14'
		height='14'
		fill='none'
		stroke='currentColor'
		strokeWidth='2.5'
		strokeLinecap='round'
		strokeLinejoin='round'>
		<polyline points='20 6 9 17 4 12' />
	</svg>
)

const UnseenIcon = () => (
	<svg viewBox='0 0 24 24' width='14' height='14' fill='currentColor'>
		<path
			d='M12 4C7.03 4 2.73 7.11 1 11.5 2.73 15.89 7.03 19 12 19s9.27-3.11 11-7.5C21.27 7.11 16.97 4 12 4zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'
			opacity='.35'
		/>
	</svg>
)

const WontWatchIcon = () => (
	<svg
		viewBox='0 0 24 24'
		width='12'
		height='12'
		fill='none'
		stroke='currentColor'
		strokeWidth='2.5'
		strokeLinecap='round'
		strokeLinejoin='round'>
		<line x1='18' y1='6' x2='6' y2='18' />
		<line x1='6' y1='6' x2='18' y2='18' />
	</svg>
)

const CalendarIcon = () => (
	<svg viewBox='0 0 24 24' width='12' height='12' fill='currentColor' opacity='.6'>
		<path d='M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z' />
	</svg>
)

export const EpisodeToggle: React.FC<Props> = ({
	state,
	isManualOverride,
	onToggle,
	disabled = false,
	airDate,
}) => {
	const { t } = useTranslation()
	const [showDateMenu, setShowDateMenu] = useState(false)
	const [showCustomDate, setShowCustomDate] = useState(false)
	const [customDate, setCustomDate] = useState('')
	const menuRef = useRef<HTMLDivElement>(null)

	const closeMenu = useCallback(() => {
		setShowDateMenu(false)
		setShowCustomDate(false)
		setCustomDate('')
	}, [])

	useEffect(() => {
		if (!showDateMenu) return
		const handler = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu()
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [showDateMenu, closeMenu])

	const handleClick = () => {
		if (disabled) return
		if (state === WatchState.Seen) {
			onToggle(WatchState.Unseen)
		} else {
			onToggle(WatchState.Seen, new Date().toISOString())
		}
	}

	const handleDateClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (disabled || state === WatchState.Seen) return
		setShowDateMenu(true)
	}

	const handleDateOption = (option: 'now' | 'release' | 'custom') => {
		if (option === 'now') {
			onToggle(WatchState.Seen, new Date().toISOString())
			closeMenu()
		} else if (option === 'release' && airDate) {
			onToggle(WatchState.Seen, new Date(airDate).toISOString())
			closeMenu()
		} else if (option === 'custom') {
			setShowCustomDate(true)
		}
	}

	const handleCustomDateConfirm = () => {
		if (customDate) {
			onToggle(WatchState.Seen, new Date(customDate).toISOString())
		}
		closeMenu()
	}

	const handleWontWatch = () => {
		if (disabled) return
		onToggle(state === WatchState.WontWatch ? WatchState.Unseen : WatchState.WontWatch)
	}

	const title = isManualOverride
		? state === WatchState.Seen
			? 'Manually marked as watched'
			: 'Manually marked as unwatched'
		: state === WatchState.Seen
			? 'Watched'
			: state === WatchState.WontWatch
				? "Won't watch"
				: 'Not watched'

	return (
		<span className='episode-toggle-wrap'>
			<button
				className={`episode-toggle ${state === WatchState.Seen ? 'episode-toggle--seen' : ''}`}
				onClick={handleClick}
				disabled={disabled}
				title={title}>
				{state === WatchState.Seen ? <SeenIcon /> : <UnseenIcon />}
			</button>
			{state !== WatchState.Seen && (
				<button
					className='episode-toggle__date-trigger'
					onClick={handleDateClick}
					disabled={disabled}
					title={t('episodeToggle.watchedAt')}>
					<CalendarIcon />
				</button>
			)}
			<button
				className={`episode-toggle__skip ${state === WatchState.WontWatch ? 'episode-toggle__skip--active' : ''}`}
				onClick={handleWontWatch}
				disabled={disabled}
				title="Won't watch">
				<WontWatchIcon />
			</button>

			{showDateMenu && (
				<div className='episode-toggle__date-menu' ref={menuRef}>
					{!showCustomDate ? (
						<>
							<button
								className='episode-toggle__date-option'
								onClick={() => handleDateOption('now')}>
								{t('episodeToggle.watchedNow')}
							</button>
							{airDate && (
								<button
									className='episode-toggle__date-option'
									onClick={() => handleDateOption('release')}>
									{t('episodeToggle.watchedRelease')} ({new Date(airDate).toLocaleDateString()})
								</button>
							)}
							<button
								className='episode-toggle__date-option'
								onClick={() => handleDateOption('custom')}>
								{t('episodeToggle.watchedCustom')}
							</button>
						</>
					) : (
						<div className='episode-toggle__custom-date'>
							<input
								type='date'
								value={customDate}
								onChange={(e) => setCustomDate(e.target.value)}
								autoFocus
							/>
							<button
								className='episode-toggle__date-option episode-toggle__date-option--confirm'
								onClick={handleCustomDateConfirm}
								disabled={!customDate}>
								{t('common.confirm')}
							</button>
						</div>
					)}
				</div>
			)}
		</span>
	)
}
