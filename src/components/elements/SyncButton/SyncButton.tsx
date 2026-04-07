import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './SyncButton.scss'

interface Props {
	onSync: () => Promise<void>
	/** Show a full text label next to the icon (default: icon-only) */
	withLabel?: boolean
	className?: string
}

export const SyncButton: React.FC<Props> = ({ onSync, withLabel = false, className = '' }) => {
	const { t } = useTranslation()
	const [syncing, setSyncing] = useState(false)
	const [done, setDone] = useState(false)

	const handleClick = async () => {
		if (syncing) return
		setSyncing(true)
		setDone(false)
		try {
			await onSync()
			setDone(true)
			setTimeout(() => setDone(false), 3000)
		} finally {
			setSyncing(false)
		}
	}

	return (
		<button
			className={`sync-btn ${syncing ? 'sync-btn--spinning' : ''} ${done ? 'sync-btn--done' : ''} ${className}`}
			onClick={handleClick}
			disabled={syncing}
			title={syncing ? t('sync.syncing') : done ? t('sync.done') : t('sync.sync')}>
			<svg
				className='sync-btn__icon'
				viewBox='0 0 24 24'
				fill='none'
				stroke='currentColor'
				strokeWidth='2'
				strokeLinecap='round'
				strokeLinejoin='round'
				aria-hidden='true'>
				<path d='M23 4v6h-6' />
				<path d='M1 20v-6h6' />
				<path d='M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' />
			</svg>
			{withLabel && (
				<span className='sync-btn__label'>
					{syncing ? t('sync.syncing') : done ? t('sync.done') : t('sync.sync')}
				</span>
			)}
		</button>
	)
}
