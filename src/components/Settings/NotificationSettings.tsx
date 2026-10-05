import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	disablePush,
	enablePush,
	getNotificationPreferences,
	getPushStatus,
	setNotificationPreferences,
} from '@/services/NotificationService/NotificationService'
import './Settings.scss'

type PushStatus = 'unsupported' | 'disabled' | 'denied' | 'enabled' | 'ready' | 'loading' | 'error'

export default function NotificationSettings() {
	const { t } = useTranslation()
	const [status, setStatus] = useState<PushStatus>('loading')
	const [busy, setBusy] = useState(false)
	const [preference, setPreference] = useState<boolean | null>(null)
	const [preferenceBusy, setPreferenceBusy] = useState(false)
	const [error, setError] = useState(false)

	useEffect(() => {
		let active = true
		void getPushStatus()
			.then((value) => { if (active) setStatus(value) })
			.catch(() => { if (active) setStatus('error') })
		void getNotificationPreferences()
			.then((value) => { if (active) setPreference(value.seasonUpdates) })
			.catch(() => { if (active) setError(true) })
		return () => { active = false }
	}, [])

	const toggleDevice = async () => {
		setBusy(true)
		setError(false)
		try {
			if (status === 'enabled') {
				await disablePush()
				setStatus('ready')
			} else {
				await enablePush()
				setStatus('enabled')
			}
		} catch (reason) {
			setStatus(reason instanceof Error && reason.message === 'push_denied' ? 'denied' : 'error')
		} finally { setBusy(false) }
	}

	const updatePreference = async (enabled: boolean) => {
		setPreferenceBusy(true)
		setError(false)
		try {
			setPreference((await setNotificationPreferences(enabled)).seasonUpdates)
		} catch { setError(true) }
		finally { setPreferenceBusy(false) }
	}

	return (
		<section className='settings-subsection' aria-label={t('settings.pushTitle')}>
			<h3>{t('settings.pushTitle')}</h3>
			<p className='settings-section__desc'>{t('settings.pushDescription')}</p>
			<div className='push-notifications__row'>
				<span role='status' aria-live='polite'>{t(`settings.pushStatus.${status}`)}</span>
				{(status === 'ready' || status === 'enabled' || status === 'error') && (
					<button className='btn-primary' type='button' onClick={() => { void toggleDevice() }} disabled={busy}>
						{busy ? t('common.loading') : status === 'enabled' ? t('settings.pushDisable') : t('settings.pushEnable')}
					</button>
				)}
			</div>
			<label className='push-notifications__preference'>
				<input type='checkbox' checked={preference ?? true} disabled={preference === null || preferenceBusy}
					onChange={(event) => { void updatePreference(event.target.checked) }} />
				<span>{t('settings.seasonUpdatesPreference')}</span>
			</label>
			{error && <p role='alert'>{t('settings.pushStatus.error')}</p>}
		</section>
	)
}

export function NotificationSettingsPage() {
	const { t } = useTranslation()
	return <div className='settings-page'><h1>{t('settings.title')}</h1><div className='settings-section'><NotificationSettings /></div></div>
}
