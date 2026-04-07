import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectCurrentUser, selectActiveProfileId } from '@/store/features/auth/selector'
import {
	selectCurrentProfile,
	selectProfileActivity,
	selectProfileLoading,
} from '@/store/features/profile'
import { fetchProfileDetail, fetchProfileActivity } from '@/store/features/profile'
import { ProfileSelector, WatchStateBadge } from '@/components/elements'
import { WatchState, MediaType } from '@/models/api/Enums'
import './Dashboard.scss'

const Dashboard: React.FC = () => {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const user = useAppSelector(selectCurrentUser)
	const activeProfileId = useAppSelector(selectActiveProfileId)
	const profile = useAppSelector(selectCurrentProfile)
	const activity = useAppSelector(selectProfileActivity)
	const loading = useAppSelector(selectProfileLoading)

	useEffect(() => {
		if (activeProfileId) {
			dispatch(fetchProfileDetail(activeProfileId))
			dispatch(fetchProfileActivity({ profileId: activeProfileId, params: { pageSize: 10 } }))
		}
	}, [dispatch, activeProfileId])

	return (
		<div className='dashboard'>
			<div className='dashboard__header'>
				<h1>{t('dashboard.welcome', { name: user?.username ?? '' })}</h1>
				<ProfileSelector />
			</div>

			{loading && <div className='dashboard__loading'>{t('common.loading')}</div>}

			{profile && (
				<div className='dashboard__stats'>
					<h2>{t('dashboard.stats')}</h2>
					<div className='stats-grid'>
						<div className='stat-card'>
							<span className='stat-card__value'>{profile.totalSeriesWatching}</span>
							<span className='stat-card__label'>{t('dashboard.seriesWatching')}</span>
						</div>
						<div className='stat-card'>
							<span className='stat-card__value'>{profile.totalSeriesCompleted}</span>
							<span className='stat-card__label'>{t('dashboard.seriesCompleted')}</span>
						</div>
						<div className='stat-card'>
							<span className='stat-card__value'>{profile.totalMoviesSeen}</span>
							<span className='stat-card__label'>{t('dashboard.moviesSeen')}</span>
						</div>
						<div className='stat-card'>
							<span className='stat-card__value'>{profile.totalEpisodesSeen}</span>
							<span className='stat-card__label'>{t('dashboard.episodesSeen')}</span>
						</div>
					</div>
				</div>
			)}

			<div className='dashboard__activity'>
				<h2>{t('dashboard.recentActivity')}</h2>
				{activity.length === 0 && !loading && (
					<p className='empty-state'>{t('dashboard.noActivity')}</p>
				)}
				<div className='activity-list'>
					{activity.map((item) => (
						<div key={item.id} className='activity-item'>
							<div className='activity-item__poster-wrap'>
								{item.mediaType === MediaType.Movie ? '🎬' : '📺'}
							</div>
							<div className='activity-item__info'>
								<span className='activity-item__title'>{item.mediaTitle}</span>
								{item.episodeName && (
									<span className='activity-item__episode'>
										S{item.seasonNumber}E{item.episodeNumber} — {item.episodeName}
									</span>
								)}
								<span className='activity-item__time'>
									{new Date(item.timestamp).toLocaleString()}
								</span>
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
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default Dashboard
