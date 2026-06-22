import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react'
import { isSortableOperation, useSortable } from '@dnd-kit/react/sortable'
import { useAppSelector } from '@/store/hooks'
import { selectActiveProfileId } from '@/store/features/auth/selector'
import { environment } from '@/environments'
import { MediaPoster, ProfileSelector, AvailabilityBadge } from '@/components/elements'
import {
	acceptWatchlistInvitation,
	addMediaToProfile,
	addWatchlistItem,
	approveWatchlistAccess,
	completeWatchlist,
	createWatchlist,
	deleteWatchlist,
	deleteWatchlistCover,
	deleteWatchlistItem,
	exportWatchlist,
	getMovies,
	getSeries,
	getWatchlist,
	getWatchlists,
	getWatchlistUserOptions,
	importWatchlist,
	inviteWatchlistMember,
	leaveWatchlist,
	rejectWatchlistAccess,
	rejectWatchlistInvitation,
	removeWatchlistMember,
	reorderWatchlistItems,
	requestWatchlistAccess,
	resolveMedia,
	searchTmdb,
	setDefaultWatchlist,
	setWatchlistCoverUrl,
	updateWatchlist,
	updateWatchlistItem,
	updateWatchlistMember,
	uploadWatchlistCover,
	getPlaylistSyncPreview,
	createJellyfinPlaylist,
	resyncJellyfinPlaylist,
	unlinkJellyfinPlaylist,
} from '@/services'
import {
	MediaType,
	WatchlistItemType,
	WatchlistRole,
	WatchlistState,
	WatchlistStatus,
} from '@/models/api/Enums'
import type {
	WatchlistChildDto,
	WatchlistDetailDto,
	WatchlistImportDto,
	WatchlistIndexDto,
	WatchlistInvitationDto,
	WatchlistItemDto,
	WatchlistMemberDto,
	WatchlistPermissionsDto,
	WatchlistSummaryDto,
	WatchlistUserOptionDto,
	MovieListDto,
	SeriesListDto,
	PlaylistSyncPreviewDto,
} from '@/models/api'
import './Watchlists.scss'

interface MediaSearchOption {
	id: number
	mediaItemId: number | null
	tmdbId: number | null
	title: string
	releaseDate: string | null
	posterPath: string | null
	mediaType: MediaType
	isExternal: boolean
}

const statusOptions = [
	WatchlistStatus.WantToWatch,
	WatchlistStatus.Watching,
	WatchlistStatus.Paused,
	WatchlistStatus.Watched,
	WatchlistStatus.Dropped,
]

const stateOptions = [
	WatchlistState.Pending,
	WatchlistState.Watching,
	WatchlistState.Completed,
	WatchlistState.Paused,
	WatchlistState.Archived,
]

const roleOptions = [WatchlistRole.Member, WatchlistRole.Admin]

const isNumericQuery = (value: string) => /^\d+$/.test(value.trim())

const toSeriesOption = (series: SeriesListDto): MediaSearchOption => ({
	id: series.id,
	mediaItemId: series.mediaItemId,
	tmdbId: null,
	title: series.title,
	releaseDate: series.releaseDate,
	posterPath: `${environment.baseUrl}/api/asset/${series.mediaItemId}/Poster`,
	mediaType: MediaType.Series,
	isExternal: false,
})

const toMovieOption = (movie: MovieListDto): MediaSearchOption => ({
	id: movie.id,
	mediaItemId: movie.mediaItemId,
	tmdbId: null,
	title: movie.title,
	releaseDate: movie.releaseDate,
	posterPath: `${environment.baseUrl}/api/asset/${movie.mediaItemId}/Poster`,
	mediaType: MediaType.Movie,
	isExternal: false,
})

const TrashIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2l1 11h4l1-11h2l-1.2 13H8.2L7 9Z' />
	</svg>
)

const PlusIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z' />
	</svg>
)

const EditIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='m5 16.6-.7 3.1 3.1-.7L17.8 8.6l-2.4-2.4L5 16.6ZM19 7.4 16.6 5l1.1-1.1c.6-.6 1.5-.6 2.1 0l.3.3c.6.6.6 1.5 0 2.1L19 7.4Z' />
	</svg>
)

const SaveIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='M5 3h12l2 2v16H5V3Zm2 2v5h9V5H7Zm0 14h10v-6H7v6Zm2-12h5V5H9v2Z' />
	</svg>
)

const CheckIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='m9.2 16.2-4-4 1.4-1.4 2.6 2.6 8.2-8.2 1.4 1.4-9.6 9.6Z' />
	</svg>
)

const CloseIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z' />
	</svg>
)

const StarIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 3Z' />
	</svg>
)

const LeaveIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='M5 4h8v2H7v12h6v2H5V4Zm10.6 4.4L19.2 12l-3.6 3.6-1.4-1.4 1.2-1.2H10v-2h5.4l-1.2-1.2 1.4-1.4Z' />
	</svg>
)

const ChevronIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='m7.4 8.6 4.6 4.6 4.6-4.6L18 10l-6 6-6-6 1.4-1.4Z' />
	</svg>
)

const GripIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='M9 5.5A1.5 1.5 0 1 1 6 5.5a1.5 1.5 0 0 1 3 0Zm9 0A1.5 1.5 0 1 1 15 5.5a1.5 1.5 0 0 1 3 0ZM9 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm9 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM9 18.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm9 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z' />
	</svg>
)

const ListIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='M5 6.5A1.5 1.5 0 1 1 2 6.5a1.5 1.5 0 0 1 3 0ZM7 5h14v3H7V5Zm-2 7A1.5 1.5 0 1 1 2 12a1.5 1.5 0 0 1 3 0Zm2-1.5h14v3H7v-3ZM5 17.5A1.5 1.5 0 1 1 2 17.5a1.5 1.5 0 0 1 3 0ZM7 16h14v3H7v-3Z' />
	</svg>
)

const ExportIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='M13 5v6h4l-5 5-5-5h4V5h2Zm-9 14v-2h16v2H4Z' />
	</svg>
)

const ImportIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='M11 16V10H7l5-5 5 5h-4v6h-2Zm-7 3v-2h16v2H4Z' />
	</svg>
)

const LinkIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='M3.9 12a4.1 4.1 0 0 1 4.1-4.1h3V6H8a6 6 0 0 0 0 12h3v-1.9H8A4.1 4.1 0 0 1 3.9 12ZM8 13h8v-2H8v2Zm5-7v1.9h3a4.1 4.1 0 0 1 0 8.2h-3V18h3a6 6 0 0 0 0-12h-3Z' />
	</svg>
)

const SyncIcon = () => (
	<svg viewBox='0 0 24 24' aria-hidden='true'>
		<path d='M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8Zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3Z' />
	</svg>
)

const permissionOptions: Array<keyof Omit<WatchlistPermissionsDto, 'canDeleteWatchlist'>> = [
	'canAddItems',
	'canRemoveItems',
	'canReorderItems',
	'canUpdateItemStatus',
	'canInviteMembers',
	'canManageMembers',
	'canUpdateWatchlist',
]

const permissionKey = (permission: keyof WatchlistPermissionsDto) =>
	({
		canAddItems: 'watchlists.permissions.addItems',
		canRemoveItems: 'watchlists.permissions.removeItems',
		canReorderItems: 'watchlists.permissions.reorderItems',
		canUpdateItemStatus: 'watchlists.permissions.updateStatus',
		canInviteMembers: 'watchlists.permissions.inviteMembers',
		canManageMembers: 'watchlists.permissions.manageMembers',
		canUpdateWatchlist: 'watchlists.permissions.updateWatchlist',
		canDeleteWatchlist: 'watchlists.permissions.deleteWatchlist',
	})[permission]

const permissionsForRole = (role: WatchlistRole): WatchlistPermissionsDto =>
	role === WatchlistRole.Admin
		? {
				canAddItems: true,
				canRemoveItems: true,
				canReorderItems: true,
				canUpdateItemStatus: true,
				canInviteMembers: true,
				canManageMembers: true,
				canUpdateWatchlist: true,
				canDeleteWatchlist: false,
			}
		: {
				canAddItems: true,
				canRemoveItems: false,
				canReorderItems: true,
				canUpdateItemStatus: true,
				canInviteMembers: false,
				canManageMembers: false,
				canUpdateWatchlist: false,
				canDeleteWatchlist: false,
			}

const watchlistStatusKey = (status: WatchlistStatus) =>
	({
		[WatchlistStatus.WantToWatch]: 'watchlists.status.wantToWatch',
		[WatchlistStatus.Watching]: 'watchlists.status.watching',
		[WatchlistStatus.Paused]: 'watchlists.status.paused',
		[WatchlistStatus.Watched]: 'watchlists.status.watched',
		[WatchlistStatus.Dropped]: 'watchlists.status.dropped',
	})[status]

const watchlistStateKey = (state: WatchlistState) =>
	({
		[WatchlistState.Pending]: 'watchlists.state.pending',
		[WatchlistState.Watching]: 'watchlists.state.watching',
		[WatchlistState.Completed]: 'watchlists.state.completed',
		[WatchlistState.Paused]: 'watchlists.state.paused',
		[WatchlistState.Archived]: 'watchlists.state.archived',
	})[state]

const roleKey = (role: WatchlistRole) =>
	({
		[WatchlistRole.Owner]: 'watchlists.role.owner',
		[WatchlistRole.Admin]: 'watchlists.role.admin',
		[WatchlistRole.Member]: 'watchlists.role.member',
	})[role]

const activePermissionCount = (permissions: WatchlistPermissionsDto) =>
	permissionOptions.filter((permission) => permissions[permission]).length

const Watchlists: React.FC = () => {
	const { t } = useTranslation()
	const activeProfileId = useAppSelector(selectActiveProfileId)
	const [index, setIndex] = useState<WatchlistIndexDto | null>(null)
	const [selectedId, setSelectedId] = useState<number | null>(null)
	const [detail, setDetail] = useState<WatchlistDetailDto | null>(null)
	const [editMode, setEditMode] = useState(false)
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [createOpen, setCreateOpen] = useState(false)
	const [newName, setNewName] = useState('')
	const [newDescription, setNewDescription] = useState('')
	const [inviteSearch, setInviteSearch] = useState('')
	const [inviteOptions, setInviteOptions] = useState<WatchlistUserOptionDto[]>([])
	const [selectedInviteUser, setSelectedInviteUser] = useState<WatchlistUserOptionDto | null>(null)
	const [inviteRole, setInviteRole] = useState<WatchlistRole>(WatchlistRole.Member)
	const [invitePermissions, setInvitePermissions] = useState<WatchlistPermissionsDto>(
		permissionsForRole(WatchlistRole.Member)
	)
	const [addMediaQuery, setAddMediaQuery] = useState('')
	const [addMediaTypeFilter, setAddMediaTypeFilter] = useState<'all' | 'movie' | 'series'>('all')
	const [addMediaLibraryOnly, setAddMediaLibraryOnly] = useState(false)
	const [selectedMedia, setSelectedMedia] = useState<MediaSearchOption | null>(null)
	const [mediaSearchResults, setMediaSearchResults] = useState<MediaSearchOption[]>([])
	const [mediaSearchLoading, setMediaSearchLoading] = useState(false)
	const [addChildId, setAddChildId] = useState('')
	const [addType, setAddType] = useState<WatchlistItemType>(WatchlistItemType.MediaItem)
	const [addStatus, setAddStatus] = useState<WatchlistStatus>(WatchlistStatus.WantToWatch)
	const [coverUrlInput, setCoverUrlInput] = useState('')
	const [showCoverUrlInput, setShowCoverUrlInput] = useState(false)
	const [syncModalOpen, setSyncModalOpen] = useState(false)
	const [syncPreview, setSyncPreview] = useState<PlaylistSyncPreviewDto | null>(null)
	const [syncLoading, setSyncLoading] = useState(false)
	const [syncTargetProfile, setSyncTargetProfile] = useState<string>('')

	const loadIndex = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const data = await getWatchlists(activeProfileId)
			setIndex(data)
			setSelectedId((current) => {
				if (current && data.watchlists.some((w) => w.id === current)) return current
				return data.defaultWatchlistId ?? data.watchlists[0]?.id ?? null
			})
		} catch (err) {
			setError(err instanceof Error ? err.message : t('common.error'))
		} finally {
			setLoading(false)
		}
	}, [activeProfileId, t])

	const loadDetail = useCallback(async () => {
		if (!selectedId) {
			setDetail(null)
			return
		}
		try {
			setDetail(await getWatchlist(selectedId, activeProfileId))
		} catch (err) {
			setError(err instanceof Error ? err.message : t('common.error'))
		}
	}, [activeProfileId, selectedId, t])

	useEffect(() => {
		loadIndex()
	}, [loadIndex])

	useEffect(() => {
		loadDetail()
	}, [loadDetail])

	useEffect(() => {
		setEditMode(false)
		setInviteSearch('')
		setInviteOptions([])
		setSelectedInviteUser(null)
	}, [selectedId])

	useEffect(() => {
		if (!detail?.permissions.canInviteMembers) {
			setInviteOptions([])
			return
		}

		const query = inviteSearch.trim()
		if (query.length === 0) {
			setInviteOptions([])
			return
		}

		let cancelled = false
		const timeout = window.setTimeout(async () => {
			try {
				const options = await getWatchlistUserOptions(query, detail.id)
				if (!cancelled) setInviteOptions(options)
			} catch {
				if (!cancelled) setInviteOptions([])
			}
		}, 180)

		return () => {
			cancelled = true
			window.clearTimeout(timeout)
		}
	}, [detail?.id, detail?.permissions.canInviteMembers, inviteSearch])

	useEffect(() => {
		if (addType !== WatchlistItemType.MediaItem) {
			setMediaSearchResults([])
			setSelectedMedia(null)
			return
		}

		const query = addMediaQuery.trim()
		if (query.length < 2 || isNumericQuery(query)) {
			setMediaSearchResults([])
			setMediaSearchLoading(false)
			return
		}

		let cancelled = false
		setMediaSearchLoading(true)
		const timeout = window.setTimeout(async () => {
			try {
				// When library filter is active, search ALL media in the app (no profile filter)
				const params = addMediaLibraryOnly
					? { search: query, pageSize: 14 }
					: { search: query, pageSize: 8, profileId: activeProfileId ?? undefined }
				const [series, movies] = await Promise.all([getSeries(params), getMovies(params)])
				if (cancelled) return
				const localResults: MediaSearchOption[] = [
					...(addMediaTypeFilter !== 'movie' ? series.data.map(toSeriesOption) : []),
					...(addMediaTypeFilter !== 'series' ? movies.data.map(toMovieOption) : []),
				]
				if (addMediaLibraryOnly) {
					setMediaSearchResults(localResults.slice(0, 14))
				} else {
					setMediaSearchResults(localResults.slice(0, 8))

					// Then search TMDB in background
					const [tmdbSeries, tmdbMovies] = await Promise.all([
						addMediaTypeFilter !== 'movie'
							? searchTmdb(query, 'series').catch(() => [])
							: Promise.resolve([]),
						addMediaTypeFilter !== 'series'
							? searchTmdb(query, 'movie').catch(() => [])
							: Promise.resolve([]),
					])
					if (cancelled) return

					const localTitles = new Set(localResults.map((r) => r.title.toLowerCase()))
					const externalResults: MediaSearchOption[] = [
						...(
							tmdbSeries as {
								id: number
								name: string | null
								poster_path: string | null
								first_air_date: string | null
							}[]
						).map((r) => ({
							id: r.id,
							mediaItemId: null,
							tmdbId: r.id,
							title: r.name ?? '',
							releaseDate: r.first_air_date,
							posterPath: r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : null,
							mediaType: MediaType.Series,
							isExternal: true,
						})),
						...(
							tmdbMovies as {
								id: number
								title: string | null
								poster_path: string | null
								release_date: string | null
							}[]
						).map((r) => ({
							id: r.id + 1_000_000,
							mediaItemId: null,
							tmdbId: r.id,
							title: r.title ?? '',
							releaseDate: r.release_date,
							posterPath: r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : null,
							mediaType: MediaType.Movie,
							isExternal: true,
						})),
					].filter((r) => !localTitles.has(r.title.toLowerCase()))

					setMediaSearchResults([...localResults.slice(0, 8), ...externalResults.slice(0, 6)])
				}
			} catch {
				if (!cancelled) setMediaSearchResults([])
			} finally {
				if (!cancelled) setMediaSearchLoading(false)
			}
		}, 350)

		return () => {
			cancelled = true
			window.clearTimeout(timeout)
		}
	}, [activeProfileId, addMediaQuery, addMediaTypeFilter, addMediaLibraryOnly, addType])

	const refreshAll = async () => {
		await loadIndex()
		await loadDetail()
	}

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newName.trim()) return
		setSaving(true)
		try {
			const created = await createWatchlist(
				{
					name: newName.trim(),
					description: newDescription.trim() || null,
					state: WatchlistState.Pending,
				},
				activeProfileId
			)
			setNewName('')
			setNewDescription('')
			setCreateOpen(false)
			setSelectedId(created.id)
			await loadIndex()
		} finally {
			setSaving(false)
		}
	}

	const handleUpdateDetail = async () => {
		if (!detail) return
		setSaving(true)
		try {
			await updateWatchlist(detail.id, {
				name: detail.name,
				description: detail.description,
				state: detail.state,
			})
			await refreshAll()
		} finally {
			setSaving(false)
		}
	}

	const handleAddItem = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!detail) return

		let mediaId =
			selectedMedia?.mediaItemId ?? (isNumericQuery(addMediaQuery) ? Number(addMediaQuery) : null)
		const childId = Number(addChildId)

		// If selected media is external (from TMDB), resolve it into global media first
		if (
			addType === WatchlistItemType.MediaItem &&
			!mediaId &&
			selectedMedia?.isExternal &&
			selectedMedia.tmdbId
		) {
			setSaving(true)
			try {
				const result = await resolveMedia({
					tmdbId: selectedMedia.tmdbId,
					type: selectedMedia.mediaType === MediaType.Series ? 'series' : 'movie',
				})
				mediaId = result.mediaItemId
			} catch {
				setSaving(false)
				return
			}
		}

		if (addType === WatchlistItemType.MediaItem && !mediaId) return
		setSaving(true)
		try {
			await addWatchlistItem(detail.id, {
				itemType: addType,
				mediaItemId: addType === WatchlistItemType.MediaItem ? mediaId : null,
				childWatchlistId: addType === WatchlistItemType.Watchlist ? childId : null,
				status: addStatus,
			})
			setAddMediaQuery('')
			setSelectedMedia(null)
			setMediaSearchResults([])
			setAddChildId('')
			await refreshAll()
		} finally {
			setSaving(false)
		}
	}

	const handleDragEnd = async (event: DragEndEvent) => {
		if (event.canceled || !detail || !detail.permissions.canReorderItems) return
		const items = [...detail.items]
		if (items.length < 2) return

		let from = -1
		let to = -1

		if (isSortableOperation(event.operation)) {
			const source = event.operation.source
			if (!source) return
			from = source.initialIndex
			to = source.index
		} else {
			const draggedItemId = Number(event.operation.source?.id)
			const targetItemId = Number(event.operation.target?.id)
			from = items.findIndex((item) => item.id === draggedItemId)
			to = items.findIndex((item) => item.id === targetItemId)
		}

		if (from < 0 || to < 0 || from === to || from >= items.length || to >= items.length) return

		const previousDetail = detail
		const [moved] = items.splice(from, 1)
		items.splice(to, 0, moved)
		const nextItems = items.map((item, index) => ({ ...item, position: index }))
		setDetail({ ...detail, items: nextItems })
		try {
			await reorderWatchlistItems(
				detail.id,
				nextItems.map((item) => item.id)
			)
			await refreshAll()
		} catch (err) {
			setDetail(previousDetail)
			setError(err instanceof Error ? err.message : t('common.error'))
		}
	}

	const availableChildWatchlists = useMemo(
		() => index?.watchlists.filter((w) => w.id !== detail?.id) ?? [],
		[index?.watchlists, detail?.id]
	)

	const handleInviteRoleChange = (role: WatchlistRole) => {
		setInviteRole(role)
		setInvitePermissions(permissionsForRole(role))
	}

	const handleExport = async () => {
		if (!detail) return
		try {
			const data = await exportWatchlist(detail.id)
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `watchlist-${data.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`
			a.click()
			URL.revokeObjectURL(url)
		} catch (err) {
			setError(err instanceof Error ? err.message : t('common.error'))
		}
	}

	const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		e.target.value = ''
		try {
			const text = await file.text()
			const json = JSON.parse(text) as WatchlistImportDto
			if (!json.name || !Array.isArray(json.items)) {
				setError(t('watchlists.importInvalidFormat'))
				return
			}
			setSaving(true)
			const result = await importWatchlist(json)
			await loadIndex()
			setSelectedId(result.watchlistId)
			if (result.errors.length > 0) {
				setError(
					`${t('watchlists.importPartial', { imported: result.importedItems, total: result.totalItems })}`
				)
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : t('watchlists.importInvalidFormat'))
		} finally {
			setSaving(false)
		}
	}

	const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file || !detail) return
		e.target.value = ''
		try {
			setSaving(true)
			await uploadWatchlistCover(detail.id, file)
			await refreshAll()
		} catch (err) {
			setError(err instanceof Error ? err.message : t('common.error'))
		} finally {
			setSaving(false)
		}
	}

	const handleCoverDelete = async () => {
		if (!detail) return
		try {
			setSaving(true)
			await deleteWatchlistCover(detail.id)
			await refreshAll()
		} catch (err) {
			setError(err instanceof Error ? err.message : t('common.error'))
		} finally {
			setSaving(false)
		}
	}

	const handleCoverFromUrl = async () => {
		if (!detail || !coverUrlInput.trim()) return
		try {
			setSaving(true)
			await setWatchlistCoverUrl(detail.id, coverUrlInput.trim())
			setCoverUrlInput('')
			setShowCoverUrlInput(false)
			await refreshAll()
		} catch (err) {
			setError(err instanceof Error ? err.message : t('common.error'))
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className='watchlists-page'>
			<div className='watchlists-page__header'>
				<div>
					<h1>{t('watchlists.title')}</h1>
					<p>{t('watchlists.subtitle')}</p>
				</div>
				<div className='watchlists-page__header-actions'>
					<ProfileSelector />
					<label className='btn-secondary btn-sm btn-icon' title={t('watchlists.import')}>
						<ImportIcon />
						<input
							type='file'
							accept='.json'
							hidden
							onChange={handleImportFile}
							disabled={saving}
						/>
					</label>
					<button className='btn-primary btn-sm' onClick={() => setCreateOpen((v) => !v)}>
						+ {t('watchlists.create')}
					</button>
				</div>
			</div>

			{error && <div className='error-message'>{error}</div>}
			{loading && <div className='loading-state'>{t('common.loading')}</div>}

			{createOpen && (
				<form className='watchlist-create' onSubmit={handleCreate}>
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
					<button className='btn-primary btn-sm' disabled={saving || !newName.trim()}>
						{t('common.create')}
					</button>
				</form>
			)}

			{index && index.watchlists.length === 0 && index.pendingInvitations.length === 0 && (
				<div className='watchlists-empty'>
					<h2>{t('watchlists.emptyTitle')}</h2>
					<p>{t('watchlists.emptyText')}</p>
					<button className='btn-primary' onClick={() => setCreateOpen(true)}>
						+ {t('watchlists.createFirst')}
					</button>
				</div>
			)}

			{index && (
				<div className='watchlists-shell'>
					<aside className='watchlists-sidebar'>
						{index.pendingInvitations.length > 0 && (
							<section className='watchlists-panel'>
								<h2>{t('watchlists.pendingInvitations')}</h2>
								{index.pendingInvitations.map((invitation) => (
									<InvitationCard
										key={invitation.id}
										invitation={invitation}
										t={t}
										onAccept={async () => {
											await acceptWatchlistInvitation(invitation.id)
											await loadIndex()
										}}
										onReject={async () => {
											await rejectWatchlistInvitation(invitation.id)
											await loadIndex()
										}}
									/>
								))}
							</section>
						)}

						<section className='watchlists-panel'>
							<h2>{t('watchlists.myWatchlists')}</h2>
							{index.watchlists.map((watchlist: WatchlistSummaryDto) => (
								<button
									key={watchlist.id}
									className={`watchlist-nav ${selectedId === watchlist.id ? 'watchlist-nav--active' : ''}`}
									onClick={() => setSelectedId(watchlist.id)}>
									<span>{watchlist.name}</span>
									<small>
										{watchlist.itemCount} {t('common.items')} · {t(roleKey(watchlist.role))}
									</small>
								</button>
							))}
						</section>

						{index.incomingAccessRequests.length > 0 && (
							<section className='watchlists-panel'>
								<h2>{t('watchlists.accessRequests')}</h2>
								{index.incomingAccessRequests.map((request) => (
									<div key={request.id} className='access-request'>
										<strong>{request.requestingUsername}</strong>
										<span>{request.watchlistName}</span>
										<div>
											<button
												className='btn-primary btn-sm'
												onClick={async () => {
													await approveWatchlistAccess(request.id)
													await loadIndex()
												}}>
												{t('watchlists.approve')}
											</button>
											<button
												className='btn-secondary btn-sm'
												onClick={async () => {
													await rejectWatchlistAccess(request.id)
													await loadIndex()
												}}>
												{t('watchlists.reject')}
											</button>
										</div>
									</div>
								))}
							</section>
						)}
					</aside>

					<main className='watchlists-detail'>
						{detail ? (
							<>
								{editMode ? (
									<section className='watchlist-editor'>
										<header className='watchlist-editor__header'>
											<div>
												<span>{t('watchlists.editMode')}</span>
												<h2>{detail.name}</h2>
											</div>
											<div className='watchlist-editor__actions'>
												<IconButton
													label={t('watchlists.viewMode')}
													onClick={() => setEditMode(false)}>
													<CloseIcon />
												</IconButton>
												<IconButton
													label={t('common.save')}
													variant='primary'
													disabled={saving || !detail.permissions.canUpdateWatchlist}
													onClick={handleUpdateDetail}>
													<SaveIcon />
												</IconButton>
												<IconButton
													label={t('watchlists.markCompleted')}
													variant='success'
													disabled={saving || !detail.permissions.canUpdateWatchlist}
													onClick={async () => {
														await completeWatchlist(detail.id)
														await refreshAll()
													}}>
													<CheckIcon />
												</IconButton>
												<IconButton
													label={
														index.defaultWatchlistId === detail.id
															? t('watchlists.defaultWatchlist')
															: t('watchlists.makeDefault')
													}
													variant={index.defaultWatchlistId === detail.id ? 'warning' : 'default'}
													onClick={async () => {
														await setDefaultWatchlist(detail.id)
														await loadIndex()
													}}>
													<StarIcon />
												</IconButton>
												{detail.role !== WatchlistRole.Owner && (
													<IconButton
														label={t('watchlists.leave')}
														variant='danger'
														onClick={async () => {
															await leaveWatchlist(detail.id)
															setSelectedId(null)
															await loadIndex()
														}}>
														<LeaveIcon />
													</IconButton>
												)}
												{detail.permissions.canDeleteWatchlist && (
													<IconButton
														label={t('common.delete')}
														variant='danger'
														onClick={async () => {
															await deleteWatchlist(detail.id)
															setSelectedId(null)
															await loadIndex()
														}}>
														<TrashIcon />
													</IconButton>
												)}
											</div>
										</header>
										<div className='watchlist-editor__body'>
											<label>
												<span>{t('watchlists.name')}</span>
												<input
													value={detail.name}
													disabled={!detail.permissions.canUpdateWatchlist}
													onChange={(e) => setDetail({ ...detail, name: e.target.value })}
												/>
											</label>
											<label>
												<span>{t('media.status')}</span>
												<WatchlistStateSelect
													value={detail.state}
													disabled={!detail.permissions.canUpdateWatchlist}
													t={t}
													onChange={(state) => setDetail({ ...detail, state })}
												/>
											</label>
											<label className='watchlist-editor__description'>
												<span>{t('watchlists.description')}</span>
												<textarea
													value={detail.description ?? ''}
													disabled={!detail.permissions.canUpdateWatchlist}
													onChange={(e) => setDetail({ ...detail, description: e.target.value })}
													placeholder={t('watchlists.description')}
												/>
											</label>
											{detail.permissions.canUpdateWatchlist && (
												<div className='watchlist-editor__cover'>
													<span>{t('watchlists.cover')}</span>
													<div className='watchlist-editor__cover-controls'>
														{detail.coverUrl && (
															<WatchlistCover
																watchlistId={detail.id}
																coverUrl={detail.coverUrl}
																small
															/>
														)}
														<label className='btn-secondary btn-sm'>
															<ImportIcon /> {t('watchlists.uploadCover')}
															<input
																type='file'
																accept='image/jpeg,image/png,image/webp'
																hidden
																onChange={handleCoverUpload}
															/>
														</label>
														<button
															className='btn-secondary btn-sm'
															onClick={() => setShowCoverUrlInput((v) => !v)}
															disabled={saving}>
															<LinkIcon /> {t('watchlists.coverFromUrl')}
														</button>
														{detail.coverUrl && (
															<button
																className='btn-danger btn-sm'
																onClick={handleCoverDelete}
																disabled={saving}>
																{t('watchlists.removeCover')}
															</button>
														)}
													</div>
													{showCoverUrlInput && (
														<div className='watchlist-editor__cover-url'>
															<input
																type='url'
																value={coverUrlInput}
																onChange={(e) => setCoverUrlInput(e.target.value)}
																placeholder={t('watchlists.coverUrlPlaceholder')}
																onKeyDown={(e) => {
																	if (e.key === 'Enter') handleCoverFromUrl()
																}}
															/>
															<button
																className='btn-primary btn-sm'
																onClick={handleCoverFromUrl}
																disabled={saving || !coverUrlInput.trim()}>
																{t('common.save')}
															</button>
														</div>
													)}
												</div>
											)}
										</div>
									</section>
								) : (
									<section className='watchlist-overview'>
										{detail.coverUrl && (
											<WatchlistCover watchlistId={detail.id} coverUrl={detail.coverUrl} />
										)}
										<div className='watchlist-overview__copy'>
											<div className='watchlist-overview__eyebrow'>
												<span>{t(roleKey(detail.role))}</span>
												<span>{t(watchlistStateKey(detail.state))}</span>
												{index.defaultWatchlistId === detail.id && (
													<span>{t('watchlists.defaultWatchlist')}</span>
												)}
											</div>
											<h2>{detail.name}</h2>
											<p>{detail.description || t('watchlists.noDescription')}</p>
										</div>
										<div className='watchlist-overview__stats'>
											<strong>{detail.items.length}</strong>
											<span>{t('common.items')}</span>
										</div>
										<div className='watchlist-overview__actions'>
											<IconButton
												label={t('watchlists.editMode')}
												onClick={() => setEditMode(true)}>
												<EditIcon />
											</IconButton>
											<IconButton label={t('watchlists.export')} onClick={handleExport}>
												<ExportIcon />
											</IconButton>
											<IconButton
												label={
													detail.jellyfinPlaylistId
														? t('watchlists.jellyfinSynced')
														: t('watchlists.syncToJellyfin')
												}
												variant={detail.jellyfinPlaylistId ? 'success' : 'default'}
												onClick={async () => {
													if (detail.jellyfinPlaylistId) {
														setSyncModalOpen(true)
														setSyncPreview(null)
													} else {
														setSyncModalOpen(true)
														setSyncLoading(true)
														try {
															const preview = await getPlaylistSyncPreview(detail.id)
															setSyncPreview(preview)
															if (preview.availableProfiles.length > 0)
																setSyncTargetProfile(preview.availableProfiles[0].jellyfinUserId)
														} finally {
															setSyncLoading(false)
														}
													}
												}}>
												<SyncIcon />
											</IconButton>
											<IconButton
												label={
													index.defaultWatchlistId === detail.id
														? t('watchlists.defaultWatchlist')
														: t('watchlists.makeDefault')
												}
												onClick={async () => {
													await setDefaultWatchlist(detail.id)
													await loadIndex()
												}}>
												<StarIcon />
											</IconButton>
											{detail.role !== WatchlistRole.Owner && (
												<IconButton
													label={t('watchlists.leave')}
													variant='danger'
													onClick={async () => {
														await leaveWatchlist(detail.id)
														setSelectedId(null)
														await loadIndex()
													}}>
													<LeaveIcon />
												</IconButton>
											)}
										</div>
									</section>
								)}

								{syncModalOpen && detail && (
									<section className='watchlist-sync-modal'>
										<div className='watchlist-sync-modal__header'>
											<h3>
												{detail.jellyfinPlaylistId
													? t('watchlists.jellyfinLinked')
													: t('watchlists.syncToJellyfin')}
											</h3>
											<button type='button' onClick={() => setSyncModalOpen(false)}>
												<CloseIcon />
											</button>
										</div>
										{syncLoading && (
											<p className='watchlist-sync-modal__loading'>{t('common.loading')}</p>
										)}
										{!detail.jellyfinPlaylistId && !syncLoading && syncPreview && (
											<div className='watchlist-sync-modal__create'>
												<div className='watchlist-sync-modal__profile-select'>
													<label>{t('watchlists.jellyfinTargetProfile')}</label>
													<select
														value={syncTargetProfile}
														onChange={(e) => setSyncTargetProfile(e.target.value)}>
														<option value=''>{t('watchlists.selectProfile')}</option>
														{syncPreview.availableProfiles.map((p) => (
															<option key={p.jellyfinUserId} value={p.jellyfinUserId}>
																{p.displayName} ({p.ownerUsername})
															</option>
														))}
													</select>
												</div>
												{syncPreview.syncableItems.length > 0 && (
													<div className='watchlist-sync-modal__preview'>
														<h4>
															{t('watchlists.syncableItems', {
																count: syncPreview.syncableItems.length,
															})}
														</h4>
														<ul>
															{syncPreview.syncableItems.map((item, i) => (
																<li key={i} className='watchlist-sync-modal__item--ok'>
																	<span>{item.position + 1}.</span> {item.title}
																</li>
															))}
														</ul>
													</div>
												)}
												{syncPreview.skippedItems.length > 0 && (
													<div className='watchlist-sync-modal__preview'>
														<h4>
															{t('watchlists.skippedItems', {
																count: syncPreview.skippedItems.length,
															})}
														</h4>
														<ul>
															{syncPreview.skippedItems.map((item, i) => (
																<li key={i} className='watchlist-sync-modal__item--skip'>
																	<span>{item.title}</span>
																	<em>{item.reason}</em>
																</li>
															))}
														</ul>
													</div>
												)}
												<p className='watchlist-sync-modal__note'>{t('watchlists.syncAutoNote')}</p>
												<button
													type='button'
													className='watchlist-sync-modal__confirm'
													disabled={!syncTargetProfile || syncPreview.syncableItems.length === 0}
													onClick={async () => {
														setSyncLoading(true)
														try {
															await createJellyfinPlaylist(detail.id, syncTargetProfile)
															setSyncModalOpen(false)
															await loadDetail()
														} finally {
															setSyncLoading(false)
														}
													}}>
													{t('watchlists.createPlaylist')}
												</button>
											</div>
										)}
										{detail.jellyfinPlaylistId && (
											<div className='watchlist-sync-modal__linked'>
												<p className='watchlist-sync-modal__status'>
													{t('watchlists.playlistLinked')}
												</p>
												<div className='watchlist-sync-modal__actions'>
													<button
														type='button'
														onClick={async () => {
															setSyncLoading(true)
															try {
																await resyncJellyfinPlaylist(detail.id)
															} finally {
																setSyncLoading(false)
															}
														}}
														disabled={syncLoading}>
														{t('watchlists.resync')}
													</button>
													<button
														type='button'
														className='watchlist-sync-modal__unlink'
														onClick={async () => {
															setSyncLoading(true)
															try {
																await unlinkJellyfinPlaylist(detail.id)
																setSyncModalOpen(false)
																await loadDetail()
															} finally {
																setSyncLoading(false)
															}
														}}
														disabled={syncLoading}>
														{t('watchlists.unlinkPlaylist')}
													</button>
												</div>
											</div>
										)}
									</section>
								)}

								{editMode && detail.permissions.canAddItems && (
									<form className='watchlist-add-item' onSubmit={handleAddItem}>
										<div className='watchlist-add-item__label'>
											<PlusIcon />
											<span>{t('watchlists.addItem')}</span>
										</div>
										<ItemTypeSelect
											value={addType}
											t={t}
											onChange={(nextType) => {
												setAddType(nextType)
												setSelectedMedia(null)
												setMediaSearchResults([])
											}}
										/>
										{addType === WatchlistItemType.MediaItem ? (
											<div className='watchlist-media-search'>
												<input
													value={addMediaQuery}
													onChange={(e) => {
														setAddMediaQuery(e.target.value)
														setSelectedMedia(null)
													}}
													placeholder={t('watchlists.mediaSearchPlaceholder')}
													autoComplete='off'
												/>
												<div className='watchlist-media-type-filter'>
													<button
														type='button'
														className={addMediaTypeFilter === 'all' ? 'active' : ''}
														onClick={() => {
															setAddMediaTypeFilter('all')
															setSelectedMedia(null)
														}}>
														{t('common.all')}
													</button>
													<button
														type='button'
														className={addMediaTypeFilter === 'movie' ? 'active' : ''}
														onClick={() => {
															setAddMediaTypeFilter('movie')
															setSelectedMedia(null)
														}}>
														{t('import.movie')}
													</button>
													<button
														type='button'
														className={addMediaTypeFilter === 'series' ? 'active' : ''}
														onClick={() => {
															setAddMediaTypeFilter('series')
															setSelectedMedia(null)
														}}>
														{t('import.series')}
													</button>
													<button
														type='button'
														className={`watchlist-media-type-filter__library${addMediaLibraryOnly ? ' active' : ''}`}
														onClick={() => {
															setAddMediaLibraryOnly(!addMediaLibraryOnly)
															setSelectedMedia(null)
														}}
														title={t('watchlists.libraryOnlyTooltip')}>
														📚 {t('watchlists.libraryOnly')}
													</button>
												</div>
												{selectedMedia && (
													<span className='watchlist-media-search__selected'>
														{selectedMedia.posterPath && (
															<img
																src={selectedMedia.posterPath}
																alt=''
																className='watchlist-media-search__poster'
															/>
														)}
														{selectedMedia.title}
														{selectedMedia.isExternal
															? ` · TMDB#${selectedMedia.tmdbId}`
															: ` · #${selectedMedia.mediaItemId}`}
													</span>
												)}
												{mediaSearchLoading && (
													<div className='watchlist-media-search__menu'>
														<span>{t('common.loading')}</span>
													</div>
												)}
												{!mediaSearchLoading && mediaSearchResults.length > 0 && !selectedMedia && (
													<div className='watchlist-media-search__menu'>
														{mediaSearchResults.map((result) => (
															<button
																key={`${result.mediaType}-${result.id}-${result.isExternal ? 'ext' : 'local'}`}
																type='button'
																className={
																	result.isExternal ? 'watchlist-media-search__item--external' : ''
																}
																onClick={() => {
																	setSelectedMedia(result)
																	setAddMediaQuery(result.title)
																	setMediaSearchResults([])
																}}>
																{result.posterPath && (
																	<img
																		src={result.posterPath}
																		alt=''
																		className='watchlist-media-search__poster'
																	/>
																)}
																<span className='watchlist-media-search__info'>
																	<span>{result.title}</span>
																	<small>
																		{result.mediaType === MediaType.Series
																			? t('import.series')
																			: t('import.movie')}
																		{result.releaseDate && ` · ${result.releaseDate.slice(0, 4)}`}
																		{result.isExternal ? ` · TMDB` : ` · #${result.mediaItemId}`}
																	</small>
																</span>
															</button>
														))}
													</div>
												)}
												{!mediaSearchLoading &&
													addMediaQuery.trim().length >= 2 &&
													!isNumericQuery(addMediaQuery) &&
													mediaSearchResults.length === 0 &&
													!selectedMedia && (
														<div className='watchlist-media-search__menu'>
															<span>{t('watchlists.noMediaResults')}</span>
														</div>
													)}
											</div>
										) : (
											<WatchlistPicker
												value={addChildId}
												watchlists={availableChildWatchlists}
												t={t}
												onChange={setAddChildId}
											/>
										)}
										<StatusSelect
											value={addStatus}
											onChange={setAddStatus}
											t={t}
											className='watchlist-select--status'
										/>
										<button
											className='watchlist-icon-button watchlist-icon-button--primary watchlist-add-item__submit'
											aria-label={t('common.add')}
											title={t('common.add')}
											disabled={
												saving ||
												(addType === WatchlistItemType.MediaItem
													? !selectedMedia && !isNumericQuery(addMediaQuery)
													: !addChildId)
											}>
											<PlusIcon />
										</button>
									</form>
								)}

								<DragDropProvider onDragEnd={handleDragEnd}>
									<section className='watchlist-items'>
										{detail.items.map((item) => (
											<WatchlistItemRow
												key={item.id}
												item={item}
												detail={detail}
												activeProfileId={activeProfileId}
												t={t}
												onUpdate={async (status, position) => {
													await updateWatchlistItem(detail.id, item.id, { status, position })
													await refreshAll()
												}}
												onDelete={async () => {
													await deleteWatchlistItem(detail.id, item.id)
													await refreshAll()
												}}
												onAddToProfile={async (mediaItemId) => {
													if (!activeProfileId) return
													await addMediaToProfile(activeProfileId, mediaItemId)
													await refreshAll()
												}}
												onRequestAccess={async (watchlistId) => {
													await requestWatchlistAccess(watchlistId)
													await refreshAll()
												}}
												onSelectWatchlist={(id) => setSelectedId(id)}
											/>
										))}
									</section>
								</DragDropProvider>

								{editMode && (
									<section className='watchlist-members'>
										<div className='watchlist-section-heading'>
											<h2>{t('watchlists.members')}</h2>
											<p>{t('watchlists.membersSubtitle')}</p>
										</div>
										<div className='watchlist-members__grid'>
											{detail.members.map((member) => (
												<MemberEditor
													key={member.id}
													member={member}
													detail={detail}
													t={t}
													onSave={async (role, permissions) => {
														await updateWatchlistMember(detail.id, member.id, role, permissions)
														await refreshAll()
													}}
													onRemove={async () => {
														await removeWatchlistMember(detail.id, member.id)
														await refreshAll()
													}}
												/>
											))}
										</div>
										{detail.permissions.canInviteMembers && (
											<form
												className='watchlist-invite-form'
												onSubmit={async (e) => {
													e.preventDefault()
													if (!selectedInviteUser) return
													await inviteWatchlistMember(detail.id, {
														userId: selectedInviteUser.id,
														role: inviteRole,
														permissions: invitePermissions,
													})
													setInviteSearch('')
													setSelectedInviteUser(null)
													handleInviteRoleChange(WatchlistRole.Member)
													await refreshAll()
												}}>
												<div className='watchlist-user-search'>
													<input
														value={inviteSearch}
														onChange={(e) => {
															setInviteSearch(e.target.value)
															setSelectedInviteUser(null)
														}}
														placeholder={t('watchlists.userSearchPlaceholder')}
														autoComplete='off'
													/>
													{selectedInviteUser && (
														<span className='watchlist-user-search__selected'>
															{selectedInviteUser.username}
														</span>
													)}
													{inviteOptions.length > 0 && !selectedInviteUser && (
														<div className='watchlist-user-search__menu'>
															{inviteOptions.map((user) => (
																<button
																	key={user.id}
																	type='button'
																	disabled={user.isMember || user.hasPendingInvitation}
																	onClick={() => {
																		setSelectedInviteUser(user)
																		setInviteSearch(user.username)
																	}}>
																	<span>{user.username}</span>
																	<small>
																		{user.isMember
																			? t('watchlists.alreadyMember')
																			: user.hasPendingInvitation
																				? t('watchlists.pendingInvitation')
																				: `#${user.id}`}
																	</small>
																</button>
															))}
														</div>
													)}
												</div>
												<RoleSelect value={inviteRole} t={t} onChange={handleInviteRoleChange} />
												<button className='btn-primary btn-sm' disabled={!selectedInviteUser}>
													<PlusIcon /> {t('watchlists.invite')}
												</button>
												{inviteRole === WatchlistRole.Member && (
													<PermissionChecklist
														permissions={invitePermissions}
														t={t}
														onChange={setInvitePermissions}
													/>
												)}
											</form>
										)}
									</section>
								)}
							</>
						) : (
							<div className='watchlists-empty watchlists-empty--detail'>
								<h2>{t('watchlists.selectAWatchlist')}</h2>
							</div>
						)}
					</main>
				</div>
			)}
		</div>
	)
}

interface PermissionChecklistProps {
	permissions: WatchlistPermissionsDto
	t: (key: string, opts?: Record<string, unknown>) => string
	onChange: (permissions: WatchlistPermissionsDto) => void
	disabled?: boolean
}

interface WatchlistCoverProps {
	watchlistId: number
	coverUrl: string
	small?: boolean
}

const WatchlistCover: React.FC<WatchlistCoverProps> = ({ coverUrl, small }) => {
	const [hasError, setHasError] = useState(false)
	const src = `${environment.baseUrl}${coverUrl}`

	if (hasError) return null

	return (
		<img
			className={`watchlist-cover${small ? ' watchlist-cover--small' : ''}`}
			src={src}
			alt=''
			loading='lazy'
			onError={() => setHasError(true)}
		/>
	)
}

interface IconButtonProps {
	label: string
	children: React.ReactNode
	onClick?: () => void | Promise<void>
	disabled?: boolean
	variant?: 'default' | 'danger' | 'primary' | 'success' | 'warning'
}

const IconButton: React.FC<IconButtonProps> = ({
	label,
	children,
	onClick,
	disabled = false,
	variant = 'default',
}) => (
	<button
		type='button'
		className={`watchlist-icon-button watchlist-icon-button--${variant}`}
		onClick={onClick}
		disabled={disabled}
		aria-label={label}
		title={label}>
		{children}
	</button>
)

interface InvitationCardProps {
	invitation: WatchlistInvitationDto
	t: (key: string, opts?: Record<string, unknown>) => string
	onAccept: () => Promise<void>
	onReject: () => Promise<void>
}

const InvitationCard: React.FC<InvitationCardProps> = ({ invitation, t, onAccept, onReject }) => {
	const [previewOpen, setPreviewOpen] = useState(false)
	const itemCount = invitation.preview?.items.length ?? 0

	return (
		<div className='watchlist-invitation'>
			<div className='watchlist-invitation__summary'>
				<div>
					<strong>{invitation.watchlistName}</strong>
					<span>{t('watchlists.invitedBy', { name: invitation.invitedByUsername })}</span>
				</div>
				<span className='watchlist-pill'>{t('watchlists.itemCount', { count: itemCount })}</span>
			</div>
			{invitation.watchlistDescription && (
				<p className='watchlist-invitation__description'>{invitation.watchlistDescription}</p>
			)}
			<div className='watchlist-invitation__actions'>
				<button className='btn-primary btn-sm' onClick={onAccept}>
					{t('watchlists.accept')}
				</button>
				<button className='btn-secondary btn-sm' onClick={onReject}>
					{t('watchlists.reject')}
				</button>
				{invitation.preview && (
					<button
						type='button'
						className='btn-secondary btn-sm'
						onClick={() => setPreviewOpen((current) => !current)}>
						{previewOpen ? t('watchlists.hidePreview') : t('watchlists.showPreview')}
					</button>
				)}
			</div>
			{previewOpen && invitation.preview && (
				<ChildPreview child={invitation.preview} readonly t={t} depth={0} />
			)}
		</div>
	)
}

interface PermissionSummaryProps {
	permissions: WatchlistPermissionsDto
	t: (key: string, opts?: Record<string, unknown>) => string
}

const PermissionSummary: React.FC<PermissionSummaryProps> = ({ permissions, t }) => {
	const enabledPermissions = permissionOptions.filter((permission) => permissions[permission])
	const visiblePermissions = enabledPermissions.slice(0, 3)
	const hiddenCount = Math.max(0, enabledPermissions.length - visiblePermissions.length)

	return (
		<div className='watchlist-permission-summary'>
			{visiblePermissions.map((permission) => (
				<span key={permission}>{t(permissionKey(permission))}</span>
			))}
			{hiddenCount > 0 && <span>{t('watchlists.morePermissions', { count: hiddenCount })}</span>}
		</div>
	)
}

const PermissionChecklist: React.FC<PermissionChecklistProps> = ({
	permissions,
	t,
	onChange,
	disabled = false,
}) => (
	<div className='watchlist-permissions'>
		{permissionOptions.map((permission) => (
			<label key={permission}>
				<input
					type='checkbox'
					checked={permissions[permission]}
					disabled={disabled}
					onChange={(e) =>
						onChange({ ...permissions, [permission]: e.target.checked, canDeleteWatchlist: false })
					}
				/>
				{t(permissionKey(permission))}
			</label>
		))}
	</div>
)

interface MemberEditorProps {
	member: WatchlistMemberDto
	detail: WatchlistDetailDto
	t: (key: string, opts?: Record<string, unknown>) => string
	onSave: (role: WatchlistRole, permissions: WatchlistPermissionsDto) => Promise<void>
	onRemove: () => Promise<void>
}

const MemberEditor: React.FC<MemberEditorProps> = ({ member, detail, t, onSave, onRemove }) => {
	const [role, setRole] = useState(member.role)
	const [permissions, setPermissions] = useState(member.permissions)
	const [expanded, setExpanded] = useState(false)
	const canEdit =
		detail.permissions.canManageMembers &&
		member.role !== WatchlistRole.Owner &&
		(detail.role === WatchlistRole.Owner || member.role !== WatchlistRole.Admin)
	const permissionCount = activePermissionCount(member.permissions)

	useEffect(() => {
		setRole(member.role)
		setPermissions(member.permissions)
	}, [member])

	const handleRoleChange = (nextRole: WatchlistRole) => {
		setRole(nextRole)
		setPermissions(permissionsForRole(nextRole))
	}

	return (
		<div className='watchlist-member'>
			<div className='watchlist-member__summary'>
				<div className='watchlist-member__avatar'>{member.username.slice(0, 1).toUpperCase()}</div>
				<div className='watchlist-member__identity'>
					<strong>{member.username}</strong>
					<span>
						{t(roleKey(member.role))} ·{' '}
						{member.role === WatchlistRole.Owner
							? t('watchlists.allPermissions')
							: t('watchlists.permissionsCount', { count: permissionCount })}
					</span>
				</div>
				<span className={`watchlist-role-pill watchlist-role-pill--${member.role}`}>
					{t(roleKey(member.role))}
				</span>
				{canEdit && (
					<IconButton
						label={expanded ? t('common.close') : t('common.edit')}
						onClick={() => setExpanded((current) => !current)}>
						{expanded ? <CloseIcon /> : <EditIcon />}
					</IconButton>
				)}
			</div>
			{member.role !== WatchlistRole.Owner && !expanded && (
				<PermissionSummary permissions={member.permissions} t={t} />
			)}
			{canEdit && expanded && (
				<div className='watchlist-member__details'>
					<label>
						<span>{t('watchlists.roleLabel')}</span>
						<RoleSelect value={role} t={t} onChange={handleRoleChange} />
					</label>
					{role === WatchlistRole.Member && (
						<PermissionChecklist permissions={permissions} t={t} onChange={setPermissions} />
					)}
					<div className='watchlist-member__actions'>
						<button className='btn-primary btn-sm' onClick={() => onSave(role, permissions)}>
							{t('common.save')}
						</button>
						<button className='btn-secondary btn-sm watchlists-danger' onClick={onRemove}>
							{t('common.remove')}
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

interface StatusSelectProps {
	value: WatchlistStatus
	onChange: (value: WatchlistStatus) => void
	t: (key: string, opts?: Record<string, unknown>) => string
	disabled?: boolean
	className?: string
}

interface CustomSelectOption<T extends number> {
	value: T
	label: string
}

interface CustomSelectProps<T extends number> {
	value: T
	options: Array<CustomSelectOption<T>>
	onChange: (value: T) => void
	disabled?: boolean
	className?: string
}

const CustomSelect = <T extends number>({
	value,
	options,
	onChange,
	disabled = false,
	className = '',
}: CustomSelectProps<T>) => {
	const [open, setOpen] = useState(false)
	const selected = options.find((option) => option.value === value) ?? options[0]

	return (
		<div className={`watchlist-select ${open ? 'watchlist-select--open' : ''} ${className}`}>
			<button
				type='button'
				className='watchlist-select__button'
				disabled={disabled}
				onClick={() => setOpen((current) => !current)}>
				<span>{selected?.label}</span>
				<ChevronIcon />
			</button>
			{open && !disabled && (
				<div className='watchlist-select__menu'>
					{options.map((option) => (
						<button
							key={option.value}
							type='button'
							className={option.value === value ? 'watchlist-select__option--active' : ''}
							onClick={() => {
								onChange(option.value)
								setOpen(false)
							}}>
							{option.label}
						</button>
					))}
				</div>
			)}
		</div>
	)
}

const StatusSelect: React.FC<StatusSelectProps> = ({
	value,
	onChange,
	t,
	disabled = false,
	className,
}) => (
	<CustomSelect
		value={value}
		disabled={disabled}
		className={className}
		options={statusOptions.map((status) => ({
			value: status,
			label: t(watchlistStatusKey(status)),
		}))}
		onChange={onChange}
	/>
)

interface RoleSelectProps {
	value: WatchlistRole
	onChange: (value: WatchlistRole) => void
	t: (key: string, opts?: Record<string, unknown>) => string
}

const RoleSelect: React.FC<RoleSelectProps> = ({ value, onChange, t }) => (
	<CustomSelect
		value={value}
		className='watchlist-select--role'
		options={roleOptions.map((role) => ({ value: role, label: t(roleKey(role)) }))}
		onChange={onChange}
	/>
)

interface ItemTypeSelectProps {
	value: WatchlistItemType
	onChange: (value: WatchlistItemType) => void
	t: (key: string, opts?: Record<string, unknown>) => string
}

const ItemTypeSelect: React.FC<ItemTypeSelectProps> = ({ value, onChange, t }) => (
	<CustomSelect
		value={value}
		className='watchlist-select--kind'
		options={[
			{ value: WatchlistItemType.MediaItem, label: t('watchlists.mediaItem') },
			{ value: WatchlistItemType.Watchlist, label: t('watchlists.watchlistBlock') },
		]}
		onChange={onChange}
	/>
)

interface WatchlistPickerProps {
	value: string
	watchlists: WatchlistSummaryDto[]
	onChange: (value: string) => void
	t: (key: string, opts?: Record<string, unknown>) => string
}

const WatchlistPicker: React.FC<WatchlistPickerProps> = ({ value, watchlists, onChange, t }) => {
	const [open, setOpen] = useState(false)
	const selected = watchlists.find((watchlist) => String(watchlist.id) === value)

	return (
		<div className={`watchlist-select watchlist-picker ${open ? 'watchlist-select--open' : ''}`}>
			<button
				type='button'
				className='watchlist-select__button'
				onClick={() => setOpen((current) => !current)}>
				<span>{selected?.name ?? t('watchlists.chooseWatchlist')}</span>
				<ChevronIcon />
			</button>
			{open && (
				<div className='watchlist-select__menu watchlist-picker__menu'>
					{watchlists.length === 0 ? (
						<span>{t('watchlists.noChildWatchlists')}</span>
					) : (
						watchlists.map((watchlist) => (
							<button
								key={watchlist.id}
								type='button'
								className={String(watchlist.id) === value ? 'watchlist-select__option--active' : ''}
								onClick={() => {
									onChange(String(watchlist.id))
									setOpen(false)
								}}>
								<strong>{watchlist.name}</strong>
								<small>{t('watchlists.itemCount', { count: watchlist.itemCount })}</small>
							</button>
						))
					)}
				</div>
			)}
		</div>
	)
}

interface WatchlistStateSelectProps {
	value: WatchlistState
	onChange: (value: WatchlistState) => void
	t: (key: string, opts?: Record<string, unknown>) => string
	disabled?: boolean
}

const WatchlistStateSelect: React.FC<WatchlistStateSelectProps> = ({
	value,
	onChange,
	t,
	disabled = false,
}) => (
	<CustomSelect
		value={value}
		disabled={disabled}
		options={stateOptions.map((state) => ({ value: state, label: t(watchlistStateKey(state)) }))}
		onChange={onChange}
	/>
)

interface ItemRowProps {
	item: WatchlistItemDto
	detail: WatchlistDetailDto
	activeProfileId: number | null
	t: (key: string, opts?: Record<string, unknown>) => string
	onUpdate: (status: WatchlistStatus, position?: number | null) => Promise<void>
	onDelete: () => Promise<void>
	onAddToProfile: (mediaItemId: number) => Promise<void>
	onRequestAccess: (watchlistId: number) => Promise<void>
	onSelectWatchlist: (watchlistId: number) => void
}

const WatchlistItemRow: React.FC<ItemRowProps> = ({
	item,
	detail,
	activeProfileId,
	t,
	onUpdate,
	onDelete,
	onAddToProfile,
	onRequestAccess,
	onSelectWatchlist,
}) => {
	const [expanded, setExpanded] = useState(false)
	const media = item.media
	const child = item.childWatchlist
	const { ref, sourceRef, targetRef, handleRef, isDragging, isDropTarget } = useSortable({
		id: item.id,
		index: item.position,
		group: `watchlist-${detail.id}`,
		disabled: !detail.permissions.canReorderItems,
	})
	const setSortableRef = useCallback(
		(element: Element | null) => {
			ref(element)
			sourceRef(element)
			targetRef(element)
		},
		[ref, sourceRef, targetRef]
	)

	const unavailable = media && (!media.isInProfile || media.isBlacklisted)
	const blacklisted = media?.isBlacklisted

	return (
		<article
			ref={setSortableRef}
			className={`watchlist-item ${unavailable ? 'watchlist-item--unavailable' : ''} ${blacklisted ? 'watchlist-item--blocked' : ''} ${isDragging ? 'watchlist-item--dragging' : ''} ${isDropTarget ? 'watchlist-item--drop-target' : ''}`}>
			<div className='watchlist-item__position'>
				<button
					ref={handleRef}
					type='button'
					className='watchlist-item__drag-handle'
					disabled={!detail.permissions.canReorderItems}
					aria-label={t('watchlists.dragHandle')}>
					<GripIcon />
				</button>
				{detail.permissions.canReorderItems ? (
					<input
						type='number'
						min='1'
						aria-label={t('watchlists.position')}
						value={item.position + 1}
						onChange={(e) => {
							const next = Number(e.target.value)
							if (Number.isFinite(next) && next > 0) onUpdate(item.status, next - 1)
						}}
					/>
				) : (
					<span className='watchlist-item__position-value'>{item.position + 1}</span>
				)}
			</div>

			{media && (
				<>
					<MediaPoster
						mediaItemId={blacklisted ? null : media.mediaItemId}
						alt={media.title}
						className='watchlist-item__poster'
						fallback={media.mediaType === MediaType.Series ? 'TV' : 'M'}
					/>
					<div className='watchlist-item__content'>
						{!unavailable ? (
							<Link
								className='watchlist-item__title'
								to={
									media.mediaType === MediaType.Series
										? `/series/${media.seriesId}`
										: `/movies/${media.movieId}`
								}>
								{media.title}
								{media.userRating != null && (
									<span className='watchlist-item__rating'>★ {media.userRating}</span>
								)}
							</Link>
						) : (
							<span className='watchlist-item__title'>
								{media.title}
								{media.userRating != null && (
									<span className='watchlist-item__rating'>★ {media.userRating}</span>
								)}
							</span>
						)}
						<span className='watchlist-item__meta'>
							{media.mediaType === MediaType.Series ? t('import.series') : t('import.movie')}
							{media.releaseDate && ` · ${media.releaseDate.slice(0, 4)}`}
						</span>
						<AvailabilityBadge mediaItemId={media.mediaItemId} />
						{media.canAddToProfile && activeProfileId && (
							<button
								className='btn-secondary btn-sm watchlist-add-profile-button'
								onClick={() => onAddToProfile(media.mediaItemId)}>
								+ {blacklisted ? t('watchlists.unblockAndAdd') : t('watchlists.addToMedia')}
							</button>
						)}
					</div>
				</>
			)}

			{child && (
				<>
					<button
						type='button'
						className='watchlist-child-cover'
						onClick={() => setExpanded((v) => !v)}
						aria-label={expanded ? t('watchlists.hidePreview') : t('watchlists.showPreview')}>
						{child.coverUrl ? (
							<img
								src={`${environment.baseUrl}${child.coverUrl}`}
								alt={child.name}
								className='watchlist-child-cover__img'
							/>
						) : (
							<ListIcon />
						)}
					</button>
					<div className='watchlist-item__content watchlist-item__content--child'>
						<div className='watchlist-child-heading'>
							<button className='watchlist-child-title' onClick={() => setExpanded((v) => !v)}>
								{child.name}
							</button>
							<span>{t('watchlists.itemCount', { count: child.items.length })}</span>
						</div>
						{child.description && <p>{child.description}</p>}
						<div className='watchlist-child-actions'>
							{child.hasFullAccess ? (
								<button
									className='btn-secondary btn-sm'
									onClick={() => onSelectWatchlist(child.id)}>
									{t('watchlists.openWatchlist')}
								</button>
							) : (
								child.canRequestAccess && (
									<button
										className='btn-secondary btn-sm'
										onClick={() => onRequestAccess(child.id)}>
										{t('watchlists.requestAccess')}
									</button>
								)
							)}
						</div>
						{expanded && <ChildPreview child={child} readonly t={t} depth={0} />}
					</div>
				</>
			)}

			<div className='watchlist-item__actions'>
				<StatusSelect
					value={item.status}
					t={t}
					disabled={!detail.permissions.canUpdateItemStatus}
					className='watchlist-select--status'
					onChange={(status) => detail.permissions.canUpdateItemStatus && onUpdate(status)}
				/>
				{detail.permissions.canRemoveItems && (
					<button
						type='button'
						className='watchlist-icon-button watchlist-icon-button--danger'
						onClick={onDelete}
						aria-label={t('common.remove')}
						title={t('common.remove')}>
						<TrashIcon />
					</button>
				)}
			</div>
		</article>
	)
}

interface ChildPreviewProps {
	child: WatchlistChildDto
	readonly: boolean
	t: (key: string, opts?: Record<string, unknown>) => string
	depth: number
}

const ChildPreview: React.FC<ChildPreviewProps> = ({ child, t, depth }) => (
	<div className={`child-preview child-preview--depth-${depth}`}>
		{depth === 0 && (
			<div className='child-preview__header'>
				<div>
					<strong>{child.name}</strong>
					{child.description && <p>{child.description}</p>}
				</div>
				<span>
					{child.items.length} {t('common.items')}
				</span>
			</div>
		)}
		{child.items.length === 0 ? (
			<p className='child-preview__empty'>{t('watchlists.emptyPreview')}</p>
		) : (
			<div className='child-preview__list'>
				{child.items.map((item) => (
					<div key={item.id} className='child-preview__item'>
						<span className='child-preview__position'>{item.position + 1}</span>
						<div className='child-preview__item-main'>
							<strong>{item.media?.title ?? item.childWatchlist?.name ?? '-'}</strong>
							<small>
								{item.childWatchlist
									? t('watchlists.itemCount', { count: item.childWatchlist.items.length })
									: t(watchlistStatusKey(item.status))}
							</small>
						</div>
					</div>
				))}
			</div>
		)}
	</div>
)

export default Watchlists
