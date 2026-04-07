import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectProfiles, selectIsAdmin } from '@/store/features/auth/selector'
import {
	selectAdminUsers,
	selectImportQueue,
	selectImportQueuePagination,
	selectSyncJobs,
	selectSyncJobsPagination,
	selectWebhookLogs,
	selectWebhookLogsPagination,
	selectMediaLibrary,
	selectMediaLibraryPagination,
	selectBlacklist,
	selectAdminLoading,
	selectAdminError,
	selectBulkRefreshing,
	fetchUsers,
	fetchImportQueue,
	fetchSyncJobs,
	fetchWebhookLogs,
	fetchMediaLibrary,
	fetchBlacklist,
	doTriggerProfileSync,
	doDeleteMediaItem,
	doRefreshMediaItem,
	doRefreshAllMetadata,
	doRefreshAllImages,
	doAddToBlacklist,
	doRemoveFromBlacklist,
} from '@/store/features/admin'
import {
	selectProviderSettings,
	selectPropagationRules,
	selectSettingsLoading,
	selectSettingsError,
	fetchProviderSettings,
	fetchPropagationRules,
	addPropagationRule,
	editPropagationRule,
	removePropagationRule,
} from '@/store/features/settings'
import { SyncButton, Pagination } from '@/components/elements'
import { triggerFullSync, getAllProfiles, rePropagate } from '@/services/AdminService/AdminService'
import type { ProfileDto } from '@/models/api'
import './Admin.scss'

const Admin: React.FC = () => {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const users = useAppSelector(selectAdminUsers)
	const importQueue = useAppSelector(selectImportQueue)
	const importQueuePagination = useAppSelector(selectImportQueuePagination)
	const syncJobs = useAppSelector(selectSyncJobs)
	const syncJobsPagination = useAppSelector(selectSyncJobsPagination)
	const webhookLogs = useAppSelector(selectWebhookLogs)
	const webhookLogsPagination = useAppSelector(selectWebhookLogsPagination)
	const mediaLibrary = useAppSelector(selectMediaLibrary)
	const mediaLibraryPagination = useAppSelector(selectMediaLibraryPagination)
	const blacklist = useAppSelector(selectBlacklist)
	const loading = useAppSelector(selectAdminLoading)
	const error = useAppSelector(selectAdminError)
	const bulkRefreshing = useAppSelector(selectBulkRefreshing)
	const profiles = useAppSelector(selectProfiles)
	const isAdmin = useAppSelector(selectIsAdmin)

	// Settings state
	const providers = useAppSelector(selectProviderSettings)
	const rules = useAppSelector(selectPropagationRules)
	const settingsLoading = useAppSelector(selectSettingsLoading)
	const settingsError = useAppSelector(selectSettingsError)
	const [allProfiles, setAllProfiles] = useState<ProfileDto[]>([])
	const [newSourceId, setNewSourceId] = useState<number | ''>('')
	const [newTargetId, setNewTargetId] = useState<number | ''>('')
	const [rePropagating, setRePropagating] = useState(false)

	const [syncProfileId, setSyncProfileId] = useState<number | ''>('')
	const [blacklistInput, setBlacklistInput] = useState({
		jellyfinItemId: '',
		displayName: '',
		reason: '',
	})
	const [refreshingId, setRefreshingId] = useState<number | null>(null)
	const [forceTmdbInput, setForceTmdbInput] = useState<Record<number, string>>({})
	const [mediaPage, setMediaPage] = useState(1)
	const [importQueuePage, setImportQueuePage] = useState(1)
	const [syncJobsPage, setSyncJobsPage] = useState(1)
	const [webhookLogsPage, setWebhookLogsPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)

	useEffect(() => {
		dispatch(fetchUsers())
		dispatch(fetchBlacklist())
		dispatch(fetchProviderSettings())
		dispatch(fetchPropagationRules())
	}, [dispatch])

	useEffect(() => {
		if (isAdmin) {
			getAllProfiles()
				.then(setAllProfiles)
				.catch(() => {})
		}
	}, [isAdmin])

	const profileList = isAdmin && allProfiles.length > 0 ? allProfiles : profiles

	useEffect(() => {
		dispatch(fetchMediaLibrary({ page: mediaPage, pageSize }))
	}, [dispatch, mediaPage, pageSize])

	useEffect(() => {
		dispatch(fetchImportQueue({ page: importQueuePage, pageSize }))
	}, [dispatch, importQueuePage, pageSize])

	useEffect(() => {
		dispatch(fetchSyncJobs({ page: syncJobsPage, pageSize }))
	}, [dispatch, syncJobsPage, pageSize])

	useEffect(() => {
		dispatch(fetchWebhookLogs({ page: webhookLogsPage, pageSize }))
	}, [dispatch, webhookLogsPage, pageSize])

	const handlePageSizeChange = (newSize: number) => {
		setPageSize(newSize)
		setMediaPage(1)
		setImportQueuePage(1)
		setSyncJobsPage(1)
		setWebhookLogsPage(1)
	}

	const handleRePropagate = async () => {
		setRePropagating(true)
		try {
			await rePropagate()
		} finally {
			setRePropagating(false)
		}
	}

	const handleAddRule = () => {
		if (newSourceId === '' || newTargetId === '') return
		dispatch(
			addPropagationRule({
				sourceProfileId: newSourceId,
				targetProfileId: newTargetId,
			})
		)
		setNewSourceId('')
		setNewTargetId('')
	}

	const handleToggleRule = (id: number, isActive: boolean) => {
		dispatch(editPropagationRule({ id, isActive: !isActive }))
	}

	const handleDeleteRule = (id: number) => {
		dispatch(removePropagationRule(id))
	}

	const handleProfileSync = () => {
		if (syncProfileId === '') return
		dispatch(doTriggerProfileSync(syncProfileId))
	}

	const handleDeleteMedia = (id: number, title: string) => {
		if (!confirm(t('admin.confirmDelete', { title }))) return
		dispatch(doDeleteMediaItem(id))
	}

	const handleRefreshMedia = async (id: number) => {
		const raw = forceTmdbInput[id]?.trim()
		const forceTmdbId = raw ? Number(raw) : undefined
		if (raw && isNaN(Number(raw))) return
		setRefreshingId(id)
		await dispatch(doRefreshMediaItem({ id, forceTmdbId }))
		setRefreshingId(null)
		dispatch(fetchMediaLibrary({ page: mediaPage, pageSize }))
	}

	const handleRefreshAllMetadata = async () => {
		await dispatch(doRefreshAllMetadata())
		dispatch(fetchMediaLibrary({ page: mediaPage, pageSize }))
	}

	const handleRefreshAllImages = async () => {
		await dispatch(doRefreshAllImages())
		dispatch(fetchMediaLibrary({ page: mediaPage, pageSize }))
	}

	const handleAddToBlacklist = (e: React.FormEvent) => {
		e.preventDefault()
		if (!blacklistInput.jellyfinItemId.trim()) return
		dispatch(
			doAddToBlacklist({
				jellyfinItemId: blacklistInput.jellyfinItemId.trim(),
				displayName: blacklistInput.displayName.trim() || undefined,
				reason: blacklistInput.reason.trim() || undefined,
			})
		)
		setBlacklistInput({ jellyfinItemId: '', displayName: '', reason: '' })
	}

	const handleRemoveFromBlacklist = (id: number) => {
		dispatch(doRemoveFromBlacklist(id))
	}

	if (loading && mediaLibrary.length === 0 && blacklist.length === 0) {
		return <div className='loading-state'>{t('common.loading')}</div>
	}

	return (
		<div className='admin-page'>
			<div className='admin-page__header'>
				<h1>{t('admin.title')}</h1>
				<div className='admin-page__page-size'>
					<label>{t('admin.pageSize')}:</label>
					<select value={pageSize} onChange={(e) => handlePageSizeChange(Number(e.target.value))}>
						<option value={10}>10</option>
						<option value={25}>25</option>
						<option value={50}>50</option>
					</select>
				</div>
			</div>

			{error && <div className='admin-page__error'>{error}</div>}
			{settingsError && <div className='admin-page__error'>{settingsError}</div>}

			{/* Settings */}
			<section className='admin-section'>
				<h2>{t('settings.title')}</h2>

				{settingsLoading ? (
					<div className='loading-state'>{t('common.loading')}</div>
				) : (
					<>
						<div className='settings-subsection'>
							<h3>{t('settings.providers')}</h3>
							<p className='settings-section__desc'>{t('settings.providersDescription')}</p>

							<div className='provider-status'>
								<div className='provider-status__item'>
									<span className='provider-status__name'>TMDB</span>
									<span
										className={`provider-status__badge ${providers?.tmdbHasApiKey ? 'provider-status__badge--ok' : 'provider-status__badge--missing'}`}>
										{providers?.tmdbHasApiKey
											? t('settings.configured')
											: t('settings.notConfigured')}
									</span>
								</div>
								<div className='provider-status__item'>
									<span className='provider-status__name'>OMDb</span>
									<span
										className={`provider-status__badge ${providers?.omdbHasApiKey ? 'provider-status__badge--ok' : 'provider-status__badge--missing'}`}>
										{providers?.omdbHasApiKey
											? t('settings.configured')
											: t('settings.notConfigured')}
									</span>
								</div>
								<div className='provider-status__item'>
									<span className='provider-status__name'>TVmaze</span>
									<span className='provider-status__badge provider-status__badge--ok'>
										{t('settings.configured')}
									</span>
									<span className='provider-status__hint'>{t('settings.noKeyRequired')}</span>
								</div>
							</div>

							{providers && (
								<div className='provider-languages'>
									<span>
										{t('settings.primaryLanguage')}: <strong>{providers.primaryLanguage}</strong>
									</span>
									{providers.fallbackLanguage && (
										<span>
											{t('settings.fallbackLanguage')}:{' '}
											<strong>{providers.fallbackLanguage}</strong>
										</span>
									)}
								</div>
							)}

							<div className='settings-section__hint'>
								<p>{t('settings.envHint')}</p>
								<code>TMDB_API_KEY=your_key_here</code>
								<code>OMDB_API_KEY=your_key_here</code>
							</div>
						</div>

						<div className='settings-subsection'>
							<h3>{t('settings.propagation')}</h3>
							<p className='settings-section__desc'>{t('settings.propagationDescription')}</p>

							{rules.length === 0 ? (
								<p className='empty-text'>{t('settings.noRules')}</p>
							) : (
								<table className='admin-table'>
									<thead>
										<tr>
											<th>{t('settings.sourceProfile')}</th>
											<th>{t('settings.targetProfile')}</th>
											<th>{t('settings.active')}</th>
											<th />
										</tr>
									</thead>
									<tbody>
										{rules.map((rule) => (
											<tr key={rule.id}>
												<td>{rule.sourceProfileName}</td>
												<td>{rule.targetProfileName}</td>
												<td>
													<button
														className={`toggle-btn ${rule.isActive ? 'toggle-btn--on' : ''}`}
														onClick={() => handleToggleRule(rule.id, rule.isActive)}>
														{rule.isActive ? t('settings.active') : t('settings.inactive')}
													</button>
												</td>
												<td>
													<button className='delete-btn' onClick={() => handleDeleteRule(rule.id)}>
														{t('common.delete')}
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}

							<div className='add-rule'>
								<h3>{t('settings.addRule')}</h3>
								<div className='add-rule__form'>
									<select
										value={newSourceId}
										onChange={(e) => setNewSourceId(e.target.value ? Number(e.target.value) : '')}>
										<option value=''>{t('settings.sourceProfile')}</option>
										{profileList.map((p) => (
											<option key={p.id} value={p.id}>
												{p.displayName}
											</option>
										))}
									</select>
									<select
										value={newTargetId}
										onChange={(e) => setNewTargetId(e.target.value ? Number(e.target.value) : '')}>
										<option value=''>{t('settings.targetProfile')}</option>
										{profileList.map((p) => (
											<option key={p.id} value={p.id}>
												{p.displayName}
											</option>
										))}
									</select>
									<button className='btn-primary' onClick={handleAddRule}>
										{t('settings.addRule')}
									</button>
								</div>
							</div>

							<div className='settings-section__hint'>
								<p>{t('settings.rePropagateHint')}</p>
								<button
									className='btn-secondary btn-sm'
									onClick={handleRePropagate}
									disabled={rePropagating}>
									{rePropagating ? t('settings.rePropagating') : t('settings.rePropagate')}
								</button>
							</div>
						</div>
					</>
				)}
			</section>

			{/* Users */}
			<section className='admin-section'>
				<h2>{t('admin.users')}</h2>
				{users.length === 0 ? (
					<p className='empty-text'>{t('admin.noUsers')}</p>
				) : (
					<table className='admin-table'>
						<thead>
							<tr>
								<th>ID</th>
								<th>{t('auth.username')}</th>
								<th>Admin</th>
								<th>Created</th>
							</tr>
						</thead>
						<tbody>
							{users.map((u) => (
								<tr key={u.id}>
									<td>{u.id}</td>
									<td>{u.username}</td>
									<td>{u.isAdmin ? '✓' : '—'}</td>
									<td>{new Date(u.createdAt).toLocaleDateString()}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</section>

			{/* Sync Controls */}
			<section className='admin-section'>
				<h2>{t('admin.syncControls')}</h2>
				<div className='sync-controls'>
					<SyncButton onSync={triggerFullSync} withLabel className='btn-primary-outline' />
					<div className='sync-controls__profile'>
						<select
							value={syncProfileId}
							onChange={(e) => setSyncProfileId(e.target.value ? Number(e.target.value) : '')}>
							<option value=''>{t('profile.selectProfile')}</option>
							{profiles.map((p) => (
								<option key={p.id} value={p.id}>
									{p.displayName}
								</option>
							))}
						</select>
						<button className='btn-primary' onClick={handleProfileSync}>
							{t('admin.triggerProfileSync')}
						</button>
					</div>
					<button
						className='btn-secondary'
						onClick={handleRefreshAllMetadata}
						disabled={bulkRefreshing}>
						{bulkRefreshing ? t('admin.bulkRefreshing') : t('admin.refreshAllMetadata')}
					</button>
					<button
						className='btn-secondary'
						onClick={handleRefreshAllImages}
						disabled={bulkRefreshing}>
						{bulkRefreshing ? t('admin.bulkRefreshing') : t('admin.refreshAllImages')}
					</button>
				</div>
			</section>

			{/* Media Library */}
			<section className='admin-section'>
				<h2>{t('admin.mediaLibrary')}</h2>
				{mediaLibrary.length === 0 ? (
					<p className='empty-text'>{t('admin.noItems')}</p>
				) : (
					<table className='admin-table'>
						<thead>
							<tr>
								<th>ID</th>
								<th>{t('media.title')}</th>
								<th>{t('media.type')}</th>
								<th>{t('media.status')}</th>
								<th>TMDB</th>
								<th>TVmaze</th>
								<th>{t('admin.actions')}</th>
							</tr>
						</thead>
						<tbody>
							{mediaLibrary.map((m) => (
								<tr key={m.id}>
									<td>{m.id}</td>
									<td>{m.title}</td>
									<td>{m.mediaType}</td>
									<td>{m.status ?? '—'}</td>
									<td>{m.tmdbId ?? '—'}</td>
									<td>{m.tvMazeId ?? '—'}</td>
									<td>
										<div className='admin-table__actions'>
											<input
												type='number'
												className='admin-table__tmdb-input'
												placeholder={t('admin.forceTmdbId')}
												value={forceTmdbInput[m.id] ?? ''}
												onChange={(e) =>
													setForceTmdbInput((prev) => ({ ...prev, [m.id]: e.target.value }))
												}
											/>
											<button
												className='btn-secondary btn-sm'
												onClick={() => handleRefreshMedia(m.id)}
												disabled={refreshingId === m.id}
												title={t('admin.refreshMedia')}>
												{refreshingId === m.id ? t('admin.refreshingMedia') : t('common.refresh')}
											</button>
											<button
												className='btn-danger btn-sm'
												onClick={() => handleDeleteMedia(m.id, m.title)}
												title={t('admin.deleteMedia')}>
												{t('common.delete')}
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
				{mediaLibraryPagination.totalPages > 1 && (
					<Pagination
						page={mediaLibraryPagination.page}
						totalPages={mediaLibraryPagination.totalPages}
						totalCount={mediaLibraryPagination.totalCount}
						onPageChange={setMediaPage}
					/>
				)}
			</section>

			{/* Blacklist */}
			<section className='admin-section'>
				<h2>{t('admin.blacklist')}</h2>
				<form className='blacklist-form' onSubmit={handleAddToBlacklist}>
					<input
						type='text'
						placeholder={t('admin.jellyfinItemId')}
						value={blacklistInput.jellyfinItemId}
						onChange={(e) => setBlacklistInput((s) => ({ ...s, jellyfinItemId: e.target.value }))}
						required
					/>
					<input
						type='text'
						placeholder={t('admin.displayName')}
						value={blacklistInput.displayName}
						onChange={(e) => setBlacklistInput((s) => ({ ...s, displayName: e.target.value }))}
					/>
					<input
						type='text'
						placeholder={t('admin.reason')}
						value={blacklistInput.reason}
						onChange={(e) => setBlacklistInput((s) => ({ ...s, reason: e.target.value }))}
					/>
					<button type='submit' className='btn-primary'>
						{t('admin.addToBlacklist')}
					</button>
				</form>
				{blacklist.length === 0 ? (
					<p className='empty-text'>{t('admin.noBlacklist')}</p>
				) : (
					<table className='admin-table'>
						<thead>
							<tr>
								<th>ID</th>
								<th>{t('admin.jellyfinItemId')}</th>
								<th>{t('admin.displayName')}</th>
								<th>{t('admin.reason')}</th>
								<th>{t('admin.actions')}</th>
							</tr>
						</thead>
						<tbody>
							{blacklist.map((b) => (
								<tr key={b.id}>
									<td>{b.id}</td>
									<td className='mono'>{b.jellyfinItemId}</td>
									<td>{b.displayName ?? '—'}</td>
									<td>{b.reason ?? '—'}</td>
									<td>
										<button
											className='btn-danger btn-sm'
											onClick={() => handleRemoveFromBlacklist(b.id)}>
											{t('common.remove')}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</section>

			{/* Sync Jobs */}
			<section className='admin-section'>
				<h2>{t('admin.syncJobs')}</h2>
				{syncJobs.length === 0 ? (
					<p className='empty-text'>{t('admin.noItems')}</p>
				) : (
					<table className='admin-table'>
						<thead>
							<tr>
								<th>ID</th>
								<th>Type</th>
								<th>Profile</th>
								<th>Status</th>
								<th>Items</th>
								<th>Started</th>
							</tr>
						</thead>
						<tbody>
							{syncJobs.map((j) => (
								<tr key={j.id}>
									<td>{j.id}</td>
									<td>{j.type}</td>
									<td>{j.profileName ?? '—'}</td>
									<td>
										<span className={`status-chip status-chip--${String(j.status).toLowerCase()}`}>
											{j.status}
										</span>
									</td>
									<td>{j.itemsProcessed}</td>
									<td>{new Date(j.startedAt).toLocaleString()}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
				{syncJobsPagination.totalPages > 1 && (
					<Pagination
						page={syncJobsPagination.page}
						totalPages={syncJobsPagination.totalPages}
						totalCount={syncJobsPagination.totalCount}
						onPageChange={setSyncJobsPage}
					/>
				)}
			</section>

			{/* Import Queue */}
			<section className='admin-section'>
				<h2>{t('admin.importQueue')}</h2>
				{importQueue.length === 0 ? (
					<p className='empty-text'>{t('admin.noItems')}</p>
				) : (
					<table className='admin-table'>
						<thead>
							<tr>
								<th>ID</th>
								<th>Jellyfin Item</th>
								<th>Type</th>
								<th>Priority</th>
								<th>Status</th>
								<th>Retries</th>
							</tr>
						</thead>
						<tbody>
							{importQueue.map((item) => (
								<tr key={item.id}>
									<td>{item.id}</td>
									<td className='mono'>{item.jellyfinItemId}</td>
									<td>{item.mediaType}</td>
									<td>{item.priority}</td>
									<td>{item.status}</td>
									<td>{item.retryCount}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
				{importQueuePagination.totalPages > 1 && (
					<Pagination
						page={importQueuePagination.page}
						totalPages={importQueuePagination.totalPages}
						totalCount={importQueuePagination.totalCount}
						onPageChange={setImportQueuePage}
					/>
				)}
			</section>

			{/* Webhook Logs */}
			<section className='admin-section'>
				<h2>{t('admin.webhookLogs')}</h2>
				{webhookLogs.length === 0 ? (
					<p className='empty-text'>{t('admin.noLogs')}</p>
				) : (
					<table className='admin-table'>
						<thead>
							<tr>
								<th>ID</th>
								<th>Event</th>
								<th>Received</th>
								<th>Success</th>
								<th>Error</th>
							</tr>
						</thead>
						<tbody>
							{webhookLogs.map((log) => (
								<tr key={log.id}>
									<td>{log.id}</td>
									<td>{log.eventType ?? '—'}</td>
									<td>{new Date(log.receivedAt).toLocaleString()}</td>
									<td>{log.success ? '✓' : '✗'}</td>
									<td className='error-cell'>{log.errorMessage ?? '—'}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
				{webhookLogsPagination.totalPages > 1 && (
					<Pagination
						page={webhookLogsPagination.page}
						totalPages={webhookLogsPagination.totalPages}
						totalCount={webhookLogsPagination.totalCount}
						onPageChange={setWebhookLogsPage}
					/>
				)}
			</section>
		</div>
	)
}

export default Admin
