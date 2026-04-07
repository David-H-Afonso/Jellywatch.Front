import React, { useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectActiveProfileId } from '@/store/features/auth/selector'
import {
	selectProfileActivity,
	selectProfileActivityPagination,
	selectProfileLoading,
} from '@/store/features/profile'
import { fetchProfileActivity } from '@/store/features/profile'
import { ProfileSelector, WatchStateBadge, Pagination } from '@/components/elements'
import { WatchState, MediaType } from '@/models/api/Enums'
import './Activity.scss'

const Activity: React.FC = () => {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const activeProfileId = useAppSelector(selectActiveProfileId)
	const activity = useAppSelector(selectProfileActivity)
	const pagination = useAppSelector(selectProfileActivityPagination)
	const loading = useAppSelector(selectProfileLoading)
	const [searchParams, setSearchParams] = useSearchParams()

	const page = Number(searchParams.get('page')) || 1
	const setPage = useCallback(
		(p: number) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev)
				if (p <= 1) next.delete('page')
				else next.set('page', String(p))
				return next
			})
		},
		[setSearchParams]
	)

	useEffect(() => {
		if (activeProfileId) {
			dispatch(
				fetchProfileActivity({
					profileId: activeProfileId,
					params: { page, pageSize: 30 },
				})
			)
		}
	}, [dispatch, activeProfileId, page])

	return (
		<div className='activity-page'>
			<div className='activity-page__header'>
				<h1>{t('activity.title')}</h1>
				<ProfileSelector />
			</div>

			{loading && <div className='loading-state'>{t('common.loading')}</div>}

			{!loading && activity.length === 0 && (
				<p className='empty-state'>{t('dashboard.noActivity')}</p>
			)}

			<div className='activity-page__list'>
				{activity.map((item) => (
					<div key={item.id} className='activity-page__item'>
						<div className='activity-page__icon'>
							{item.mediaType === MediaType.Movie ? '🎬' : '📺'}
						</div>
						<div className='activity-page__info'>
							<span className='activity-page__title'>{item.mediaTitle}</span>
							{item.episodeName && (
								<span className='activity-page__episode'>
									S{item.seasonNumber}E{item.episodeNumber} — {item.episodeName}
								</span>
							)}
							<span className='activity-page__time'>
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
