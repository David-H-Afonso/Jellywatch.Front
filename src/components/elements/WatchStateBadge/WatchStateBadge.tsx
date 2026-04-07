import React from 'react'
import { useTranslation } from 'react-i18next'
import { WatchState } from '@/models/api/Enums'
import './WatchStateBadge.scss'

interface Props {
	state: WatchState
	size?: 'sm' | 'md'
}

const stateClasses: Record<WatchState, string> = {
	[WatchState.Unseen]: 'badge--unseen',
	[WatchState.InProgress]: 'badge--in-progress',
	[WatchState.Seen]: 'badge--seen',
	[WatchState.WontWatch]: 'badge--wont-watch',
}

const stateKeys: Record<WatchState, string> = {
	[WatchState.Unseen]: 'watchState.unseen',
	[WatchState.InProgress]: 'watchState.inProgress',
	[WatchState.Seen]: 'watchState.seen',
	[WatchState.WontWatch]: 'watchState.wontWatch',
}

export const WatchStateBadge: React.FC<Props> = ({ state, size = 'md' }) => {
	const { t } = useTranslation()

	return (
		<span className={`watch-state-badge ${stateClasses[state]} badge--${size}`}>
			{t(stateKeys[state])}
		</span>
	)
}
