import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store/hooks'
import { selectActiveProfileId } from '@/store/features/auth/selector'
import {
	addWatchlistItem,
	createWatchlist,
	deleteWatchlistItem,
	getWatchlist,
	getWatchlists,
} from '@/services'
import { WatchlistItemType, WatchlistState, WatchlistStatus } from '@/models/api/Enums'
import type { WatchlistDetailDto, WatchlistIndexDto } from '@/models/api'
import './AddToWatchlistModal.scss'

interface Props {
	mediaItemId: number
	mediaTitle: string
	onClose: () => void
	onChanged?: () => void
}

const statusOptions = [
	WatchlistStatus.WantToWatch,
	WatchlistStatus.Watching,
	WatchlistStatus.Paused,
	WatchlistStatus.Watched,
	WatchlistStatus.Dropped,
]

const statusKey = (status: WatchlistStatus) =>
	({
		[WatchlistStatus.WantToWatch]: 'watchlists.status.wantToWatch',
		[WatchlistStatus.Watching]: 'watchlists.status.watching',
		[WatchlistStatus.Paused]: 'watchlists.status.paused',
		[WatchlistStatus.Watched]: 'watchlists.status.watched',
		[WatchlistStatus.Dropped]: 'watchlists.status.dropped',
	})[status]

const TrashIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2l1 11h4l1-11h2l-1.2 13H8.2L7 9Z' />
	</svg>
)

const CloseIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='m6.4 5 12.6 12.6-1.4 1.4L5 6.4 6.4 5Zm12.6 1.4L6.4 19 5 17.6 17.6 5 19 6.4Z' />
	</svg>
)

const ChevronIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='m7.4 8.6 4.6 4.6 4.6-4.6L18 10l-6 6-6-6 1.4-1.4Z' />
	</svg>
)

export const AddToWatchlistModal: React.FC<Props> = ({
	mediaItemId,
	mediaTitle,
	onClose,
	onChanged,
}) => {
	const { t } = useTranslation()
	const activeProfileId = useAppSelector(selectActiveProfileId)
	const [index, setIndex] = useState<WatchlistIndexDto | null>(null)
	const [details, setDetails] = useState<Record<number, WatchlistDetailDto>>({})
	const [status, setStatus] = useState<WatchlistStatus>(WatchlistStatus.WantToWatch)
	const [newName, setNewName] = useState('')
	const [newDescription, setNewDescription] = useState('')
	const [loading, setLoading] = useState(false)
	const [savingId, setSavingId] = useState<number | 'new' | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		const load = async () => {
			setLoading(true)
			try {
				const listIndex = await getWatchlists(activeProfileId)
				if (cancelled) return
				setIndex(listIndex)
				const loaded = await Promise.all(
					listIndex.watchlists.map(async (watchlist) => [
						watchlist.id,
						await getWatchlist(watchlist.id, activeProfileId),
					])
				)
				if (!cancelled) setDetails(Object.fromEntries(loaded))
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : t('common.error'))
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => {
			cancelled = true
		}
	}, [activeProfileId, t])

	const watchlists = useMemo(() => index?.watchlists ?? [], [index?.watchlists])

	const handleAdd = async (watchlistId: number) => {
		setSavingId(watchlistId)
		try {
			await addWatchlistItem(watchlistId, {
				itemType: WatchlistItemType.MediaItem,
				mediaItemId,
				status,
			})
			onChanged?.()
			const detail = await getWatchlist(watchlistId, activeProfileId)
			setDetails((prev) => ({ ...prev, [watchlistId]: detail }))
		} catch (err) {
			setError(err instanceof Error ? err.message : t('common.error'))
		} finally {
			setSavingId(null)
		}
	}

	const handleRemove = async (watchlistId: number, itemId: number) => {
		setSavingId(watchlistId)
		try {
			await deleteWatchlistItem(watchlistId, itemId)
			onChanged?.()
			const detail = await getWatchlist(watchlistId, activeProfileId)
			setDetails((prev) => ({ ...prev, [watchlistId]: detail }))
		} catch (err) {
			setError(err instanceof Error ? err.message : t('common.error'))
		} finally {
			setSavingId(null)
		}
	}

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newName.trim()) return
		setSavingId('new')
		try {
			await createWatchlist(
				{
					name: newName.trim(),
					description: newDescription.trim() || null,
					state: WatchlistState.Pending,
					initialItem: {
						itemType: WatchlistItemType.MediaItem,
						mediaItemId,
						status,
					},
				},
				activeProfileId
			)
			onChanged?.()
			onClose()
		} catch (err) {
			setError(err instanceof Error ? err.message : t('common.error'))
		} finally {
			setSavingId(null)
		}
	}

	return (
		<div className='add-watchlist-overlay' onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
			<div className='add-watchlist-modal'>
				<header>
					<div>
						<h2>{t('watchlists.addToWatchlist')}</h2>
						<p>{mediaTitle}</p>
					</div>
					<button className='add-watchlist-icon-button' onClick={onClose} aria-label={t('common.close')}>
						<CloseIcon />
					</button>
				</header>

				{error && <div className='add-watchlist-error'>{error}</div>}
				{loading && <div className='loading-state'>{t('common.loading')}</div>}

				<label className='add-watchlist-status'>
					<span>{t('media.status')}</span>
					<StatusSelect value={status} onChange={setStatus} />
				</label>

				<div className='add-watchlist-list'>
					{watchlists.map((watchlist) => {
						const detail = details[watchlist.id]
						const existing = detail?.items.find((item) => item.mediaItemId === mediaItemId)
						const canAdd = detail?.permissions.canAddItems
						const canRemove = detail?.permissions.canRemoveItems

						return (
							<div
								key={watchlist.id}
								className={`add-watchlist-row ${existing ? 'add-watchlist-row--added' : ''}`}>
								<div>
									<strong>{watchlist.name}</strong>
									<span>{watchlist.description}</span>
								</div>
								{existing ? (
									<>
										<span className='add-watchlist-pill'>{t('watchlists.alreadyAdded')}</span>
										{canRemove && (
											<button
												className='add-watchlist-icon-button add-watchlist-icon-button--danger'
												disabled={savingId === watchlist.id}
												onClick={() => handleRemove(watchlist.id, existing.id)}
												aria-label={t('watchlists.removeFromWatchlist')}
												title={t('watchlists.removeFromWatchlist')}>
												<TrashIcon />
											</button>
										)}
									</>
								) : (
									<button
										className='btn-primary btn-sm'
										disabled={!canAdd || savingId === watchlist.id}
										onClick={() => handleAdd(watchlist.id)}>
										+ {t('common.add')}
									</button>
								)}
							</div>
						)
					})}
				</div>

				<form className='add-watchlist-create' onSubmit={handleCreate}>
					<h3>+ {t('watchlists.newWatchlist')}</h3>
					<input
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder={t('watchlists.name')}
					/>
					<input
						value={newDescription}
						onChange={(e) => setNewDescription(e.target.value)}
						placeholder={t('watchlists.description')}
					/>
					<button className='btn-primary btn-sm' disabled={savingId === 'new' || !newName.trim()}>
						{t('common.create')}
					</button>
				</form>
			</div>
		</div>
	)
}

interface StatusSelectProps {
	value: WatchlistStatus
	onChange: (value: WatchlistStatus) => void
}

const StatusSelect: React.FC<StatusSelectProps> = ({ value, onChange }) => {
	const { t } = useTranslation()
	const [open, setOpen] = useState(false)
	const selectedLabel = t(statusKey(value))

	return (
		<div className={`add-watchlist-select ${open ? 'add-watchlist-select--open' : ''}`}>
			<button
				type='button'
				className='add-watchlist-select__button'
				onClick={() => setOpen((current) => !current)}>
				<span>{selectedLabel}</span>
				<ChevronIcon />
			</button>
			{open && (
				<div className='add-watchlist-select__menu'>
					{statusOptions.map((option) => (
						<button
							key={option}
							type='button'
							className={option === value ? 'add-watchlist-select__option--active' : ''}
							onClick={() => {
								onChange(option)
								setOpen(false)
							}}>
							{t(statusKey(option))}
						</button>
					))}
				</div>
			)}
		</div>
	)
}
