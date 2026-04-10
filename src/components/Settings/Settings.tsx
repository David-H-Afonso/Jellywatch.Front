import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectProfiles, selectIsAdmin, selectCurrentUser } from '@/store/features/auth/selector'
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
import { getAllProfiles, rePropagate, deleteProfile } from '@/services/AdminService/AdminService'
import type { ProfileDto } from '@/models/api'
import './Settings.scss'

const Settings: React.FC = () => {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const providers = useAppSelector(selectProviderSettings)
	const rules = useAppSelector(selectPropagationRules)
	const loading = useAppSelector(selectSettingsLoading)
	const error = useAppSelector(selectSettingsError)
	const profiles = useAppSelector(selectProfiles)
	const isAdmin = useAppSelector(selectIsAdmin)
	const currentUser = useAppSelector(selectCurrentUser)
	const [allProfiles, setAllProfiles] = useState<ProfileDto[]>([])
	const [deletingProfileId, setDeletingProfileId] = useState<number | null>(null)

	const [newSourceId, setNewSourceId] = useState<number | ''>('')
	const [newTargetId, setNewTargetId] = useState<number | ''>('')

	useEffect(() => {
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

	const [rePropagating, setRePropagating] = useState(false)

	const handleRePropagate = async () => {
		setRePropagating(true)
		try {
			await rePropagate()
		} finally {
			setRePropagating(false)
		}
	}

	const handleDeleteProfile = async (id: number, name: string) => {
		if (!confirm(t('settings.confirmDeleteProfile', { name }))) return
		setDeletingProfileId(id)
		try {
			await deleteProfile(id)
			setAllProfiles((prev) => prev.filter((p) => p.id !== id))
		} finally {
			setDeletingProfileId(null)
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

	if (loading) {
		return <div className='loading-state'>{t('common.loading')}</div>
	}

	return (
		<div className='settings-page'>
			<h1>{t('settings.title')}</h1>

			{error && <div className='settings-page__error'>{error}</div>}

			<section className='settings-section'>
				<h2>{t('settings.providers')}</h2>
				<p className='settings-section__desc'>{t('settings.providersDescription')}</p>

				<div className='provider-status'>
					<div className='provider-status__item'>
						<span className='provider-status__name'>TMDB</span>
						<span
							className={`provider-status__badge ${providers?.tmdbHasApiKey ? 'provider-status__badge--ok' : 'provider-status__badge--missing'}`}>
							{providers?.tmdbHasApiKey ? t('settings.configured') : t('settings.notConfigured')}
						</span>
					</div>
					<div className='provider-status__item'>
						<span className='provider-status__name'>OMDb</span>
						<span
							className={`provider-status__badge ${providers?.omdbHasApiKey ? 'provider-status__badge--ok' : 'provider-status__badge--missing'}`}>
							{providers?.omdbHasApiKey ? t('settings.configured') : t('settings.notConfigured')}
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
								{t('settings.fallbackLanguage')}: <strong>{providers.fallbackLanguage}</strong>
							</span>
						)}
					</div>
				)}

				<div className='settings-section__hint'>
					<p>{t('settings.envHint')}</p>
					<code>TMDB_API_KEY=your_key_here</code>
					<code>OMDB_API_KEY=your_key_here</code>
				</div>
			</section>

			<section className='settings-section'>
				<h2>{t('settings.propagation')}</h2>
				<p className='settings-section__desc'>{t('settings.propagationDescription')}</p>

				{rules.length === 0 ? (
					<p className='empty-text'>{t('settings.noRules')}</p>
				) : (
					<table className='rules-table'>
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
				{isAdmin && (
					<div className='settings-section__hint'>
						<p>{t('settings.rePropagateHint')}</p>
						<button
							className='btn-secondary btn-sm'
							onClick={handleRePropagate}
							disabled={rePropagating}>
							{rePropagating ? t('settings.rePropagating') : t('settings.rePropagate')}
						</button>
					</div>
				)}
			</section>

			{isAdmin && (
				<section className='settings-section'>
					<h2>{t('settings.profiles')}</h2>
					<p className='settings-section__desc'>{t('settings.profilesDescription')}</p>

					{allProfiles.length === 0 ? (
						<p className='empty-text'>{t('settings.noProfiles')}</p>
					) : (
						<table className='rules-table'>
							<thead>
								<tr>
									<th>{t('auth.username')}</th>
									<th>Jellyfin ID</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{allProfiles.map((p) => {
									const isOwn =
										p.jellyfinUserId === currentUser?.jellyfinUserId && p.userId === currentUser?.id
									return (
										<tr key={p.id}>
											<td>
												{p.displayName}
												{isOwn && (
													<span className='profile-own-badge'>{t('settings.ownProfile')}</span>
												)}
											</td>
											<td className='profile-jellyfin-id'>{p.jellyfinUserId}</td>
											<td>
												{!isOwn && (
													<button
														className='delete-btn'
														onClick={() => handleDeleteProfile(p.id, p.displayName)}
														disabled={deletingProfileId === p.id}>
														{deletingProfileId === p.id
															? t('common.loading')
															: t('settings.deleteProfile')}
													</button>
												)}
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					)}
				</section>
			)}
		</div>
	)
}

export default Settings
