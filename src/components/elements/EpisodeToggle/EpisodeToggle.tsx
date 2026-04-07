import React from 'react'
import { WatchState } from '@/models/api/Enums'
import './EpisodeToggle.scss'

interface Props {
	state: WatchState
	isManualOverride: boolean
	onToggle: (newState: WatchState) => void
	disabled?: boolean
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

export const EpisodeToggle: React.FC<Props> = ({
	state,
	isManualOverride,
	onToggle,
	disabled = false,
}) => {
	const handleClick = () => {
		if (disabled) return
		// WontWatch acts like Unseen for the main toggle: clicking marks as Seen
		const next = state === WatchState.Seen ? WatchState.Unseen : WatchState.Seen
		onToggle(next)
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
			<button
				className={`episode-toggle__skip ${state === WatchState.WontWatch ? 'episode-toggle__skip--active' : ''}`}
				onClick={handleWontWatch}
				disabled={disabled}
				title="Won't watch">
				<WontWatchIcon />
			</button>
		</span>
	)
}
