import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
	getBackupSchedule,
	updateBackupSchedule,
	runBackupNow,
} from '@/services/BackupScheduleService/BackupScheduleService'
import type {
	BackupScheduleDto,
	UpdateBackupScheduleRequest,
} from '@/services/BackupScheduleService/BackupScheduleService'
import { useAppSelector } from '@/store/hooks'
import { selectCurrentUser } from '@/store/features/auth/selector'
import './BackupSchedule.scss'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

const BackupSchedule: React.FC = () => {
	const { t } = useTranslation()
	const currentUser = useAppSelector(selectCurrentUser)

	const [schedule, setSchedule] = useState<BackupScheduleDto | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [runningNow, setRunningNow] = useState(false)
	const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

	const defaultPrefix = currentUser ? `${currentUser.id}-${currentUser.username}` : ''

	// Form state
	const [isEnabled, setIsEnabled] = useState(false)
	const [backupHour, setBackupHour] = useState(3)
	const [backupMinute, setBackupMinute] = useState(0)
	const [destinationPath, setDestinationPath] = useState('/backups')
	const [fileNamePrefix, setFileNamePrefix] = useState(defaultPrefix)
	const [fileNameSuffix, setFileNameSuffix] = useState('')
	const [retentionCount, setRetentionCount] = useState(7)

	const showMessage = (text: string, type: 'success' | 'error') => {
		setMessage({ text, type })
		setTimeout(() => setMessage(null), 5000)
	}

	useEffect(() => {
		const load = async () => {
			try {
				const data = await getBackupSchedule()
				setSchedule(data)
				setIsEnabled(data.isEnabled)
				setBackupHour(data.backupHour)
				setBackupMinute(data.backupMinute)
				setDestinationPath(data.destinationPath)
				setFileNamePrefix(data.fileNamePrefix || defaultPrefix)
				setFileNameSuffix(data.fileNameSuffix || '')
				setRetentionCount(data.retentionCount)
			} catch {
				showMessage(t('backupSchedule.errorLoad'), 'error')
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [t])

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()
		setSaving(true)
		try {
			const req: UpdateBackupScheduleRequest = {
				isEnabled,
				backupHour,
				backupMinute,
				destinationPath,
				fileNamePrefix,
				fileNameSuffix,
				retentionCount,
			}
			const updated = await updateBackupSchedule(req)
			setSchedule(updated)
			showMessage(t('backupSchedule.savedSuccess'), 'success')
		} catch {
			showMessage(t('backupSchedule.errorSave'), 'error')
		} finally {
			setSaving(false)
		}
	}

	const handleRunNow = async () => {
		setRunningNow(true)
		try {
			await runBackupNow()
			showMessage(t('backupSchedule.runNowStarted'), 'success')
			setTimeout(async () => {
				try {
					const data = await getBackupSchedule()
					setSchedule(data)
				} catch {
					/* ignore */
				}
			}, 3000)
		} catch {
			showMessage(t('backupSchedule.errorRunNow'), 'error')
		} finally {
			setRunningNow(false)
		}
	}

	const pad = (n: number) => String(n).padStart(2, '0')

	const previewFileName = (() => {
		const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
		const prefix = fileNamePrefix.trim() ? `${fileNamePrefix.trim()}-` : ''
		const suffix = fileNameSuffix.trim() ? `-${fileNameSuffix.trim()}` : ''
		return `${prefix}profile-{id}-{name}-${date}${suffix}.csv`
	})()

	const statusClass = (status: string) => {
		if (status === 'success') return 'backup-schedule__badge backup-schedule__badge--success'
		if (status === 'failed') return 'backup-schedule__badge backup-schedule__badge--error'
		if (status === 'running') return 'backup-schedule__badge backup-schedule__badge--running'
		return 'backup-schedule__badge backup-schedule__badge--never'
	}

	if (loading) {
		return (
			<div className='backup-schedule'>
				<p>{t('common.loading')}</p>
			</div>
		)
	}

	return (
		<div className='backup-schedule'>
			<div className='backup-schedule__header'>
				<h1>{t('backupSchedule.title')}</h1>
				<p className='backup-schedule__subtitle'>{t('backupSchedule.subtitle')}</p>
			</div>

			{message && (
				<div className={`backup-schedule__alert backup-schedule__alert--${message.type}`}>
					{message.text}
					<button
						className='backup-schedule__alert-close'
						onClick={() => setMessage(null)}
						aria-label={t('common.close')}>
						×
					</button>
				</div>
			)}

			{/* Last run status */}
			{schedule && (
				<div className='backup-schedule__status-card'>
					<h2>{t('backupSchedule.lastRunTitle')}</h2>
					<div className='backup-schedule__status-row'>
						<span className={statusClass(schedule.lastRunStatus)}>
							{t(`backupSchedule.status_${schedule.lastRunStatus}`)}
						</span>
						{schedule.lastRunAt && (
							<span className='backup-schedule__status-date'>
								{new Date(schedule.lastRunAt).toLocaleString()}
							</span>
						)}
					</div>
					{schedule.lastRunMessage && (
						<p className='backup-schedule__status-message'>{schedule.lastRunMessage}</p>
					)}
				</div>
			)}

			<form className='backup-schedule__form' onSubmit={handleSave}>
				<div className='backup-schedule__section'>
					<h2>{t('backupSchedule.scheduleTitle')}</h2>

					{/* Enable toggle */}
					<div className='backup-schedule__field backup-schedule__field--toggle'>
						<label className='backup-schedule__toggle-label'>
							<input
								type='checkbox'
								checked={isEnabled}
								onChange={(e) => setIsEnabled(e.target.checked)}
								className='backup-schedule__toggle-input'
							/>
							<span className='backup-schedule__toggle-text'>
								{t('backupSchedule.enableLabel')}
							</span>
						</label>
						<p className='backup-schedule__field-hint'>{t('backupSchedule.enableHint')}</p>
					</div>

					{/* Time picker */}
					<div className='backup-schedule__field'>
						<label className='backup-schedule__label'>{t('backupSchedule.timeLabel')}</label>
						<div className='backup-schedule__time-row'>
							<select
								value={backupHour}
								onChange={(e) => setBackupHour(Number(e.target.value))}
								className='backup-schedule__select'>
								{HOURS.map((h) => (
									<option key={h} value={h}>
										{pad(h)}
									</option>
								))}
							</select>
							<span className='backup-schedule__time-sep'>:</span>
							<select
								value={backupMinute}
								onChange={(e) => setBackupMinute(Number(e.target.value))}
								className='backup-schedule__select'>
								{MINUTES.map((m) => (
									<option key={m} value={m}>
										{pad(m)}
									</option>
								))}
							</select>
							<span className='backup-schedule__time-utc'>UTC</span>
						</div>
						<p className='backup-schedule__field-hint'>{t('backupSchedule.timeHint')}</p>
					</div>

					{/* Destination path */}
					<div className='backup-schedule__field'>
						<label className='backup-schedule__label' htmlFor='dest-path'>
							{t('backupSchedule.destPathLabel')}
						</label>
						<input
							id='dest-path'
							type='text'
							value={destinationPath}
							onChange={(e) => setDestinationPath(e.target.value)}
							className='backup-schedule__input'
							placeholder='/backups'
						/>
						<p className='backup-schedule__field-hint'>{t('backupSchedule.destPathHint')}</p>
					</div>

					{/* File name prefix */}
					<div className='backup-schedule__field'>
						<label className='backup-schedule__label' htmlFor='filename-prefix'>
							{t('backupSchedule.fileNamePrefix')}
						</label>
						<input
							id='filename-prefix'
							type='text'
							value={fileNamePrefix}
							onChange={(e) => setFileNamePrefix(e.target.value)}
							className='backup-schedule__input'
							placeholder={defaultPrefix}
						/>
						<p className='backup-schedule__field-hint'>{t('backupSchedule.fileNamePrefixHint')}</p>
					</div>

					{/* File name suffix */}
					<div className='backup-schedule__field'>
						<label className='backup-schedule__label' htmlFor='filename-suffix'>
							{t('backupSchedule.fileNameSuffix')}
						</label>
						<input
							id='filename-suffix'
							type='text'
							value={fileNameSuffix}
							onChange={(e) => setFileNameSuffix(e.target.value)}
							className='backup-schedule__input'
							placeholder=''
						/>
					</div>

					{/* Filename preview */}
					<div className='backup-schedule__field'>
						<label className='backup-schedule__label'>{t('backupSchedule.fileNamePreview')}</label>
						<code className='backup-schedule__filename-preview'>{previewFileName}</code>
					</div>

					{/* Retention count */}
					<div className='backup-schedule__field'>
						<label className='backup-schedule__label' htmlFor='retention'>
							{t('backupSchedule.retentionLabel')}
						</label>
						<input
							id='retention'
							type='number'
							min={0}
							max={365}
							value={retentionCount}
							onChange={(e) => setRetentionCount(Number(e.target.value))}
							className='backup-schedule__input backup-schedule__input--short'
						/>
						<p className='backup-schedule__field-hint'>{t('backupSchedule.retentionHint')}</p>
					</div>
				</div>

				{/* Action buttons */}
				<div className='backup-schedule__actions'>
					<button
						type='submit'
						className='data-manager__btn data-manager__btn--primary'
						disabled={saving}>
						{saving ? t('common.loading') : `💾 ${t('common.save')}`}
					</button>
					<button
						type='button'
						className='data-manager__btn data-manager__btn--secondary'
						onClick={handleRunNow}
						disabled={runningNow}>
						{runningNow ? t('backupSchedule.running') : `▶ ${t('backupSchedule.runNowBtn')}`}
					</button>
				</div>
			</form>

			<div className='backup-schedule__info-card'>
				<h3>{t('backupSchedule.infoTitle')}</h3>
				<ul>
					<li dangerouslySetInnerHTML={{ __html: t('backupSchedule.infoNote1') }} />
					<li dangerouslySetInnerHTML={{ __html: t('backupSchedule.infoNote2') }} />
					<li dangerouslySetInnerHTML={{ __html: t('backupSchedule.infoNote3') }} />
				</ul>
			</div>
		</div>
	)
}

export default BackupSchedule
