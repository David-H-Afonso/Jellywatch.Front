import React from 'react'
import { useAppDispatch } from '@/store/hooks'
import { SyncButton } from '../SyncButton/SyncButton'
import { triggerMineSync } from '@/services/AdminService/AdminService'
import { invalidateMovieCache } from '@/store/features/movies'
import { invalidateCache as invalidateSeriesCache } from '@/store/features/series'
import './ProfileSelector.scss'

export const ProfileSelector: React.FC = () => {
	const dispatch = useAppDispatch()

	const handleSync = async () => {
		await triggerMineSync()
		dispatch(invalidateMovieCache())
		dispatch(invalidateSeriesCache())
	}

	return (
		<div className='profile-selector'>
			<SyncButton onSync={handleSync} />
		</div>
	)
}
