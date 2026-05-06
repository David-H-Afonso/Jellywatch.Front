import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
	getAdminUserSchedules,
	updateAdminUserSchedule,
	runAdminUserBackupNow,
} from '@/services/BackupScheduleService/BackupScheduleService'
import type {
	UserBackupScheduleDto,
	UpdateBackupScheduleRequest,
} from '@/services/BackupScheduleService/BackupScheduleService'
import './BackupSchedule.scss'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const pad = (n: number) => String(n).padStart(2, '0')

interface UserRowProps {
	entry: UserBackupScheduleDto
	onUpdated: (entry: UserBackupScheduleDto) => void
}

const UserRow: React.FC<UserRowProps> = ({ entry, onUpdated }) => {
	const { t } = useTranslation()
	const [expanded, setExpanded] = useState(false)
	const [saving, setSaving] = useState(false)
	const [runningNow, setRunningNow] = useState(false)
	const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

	const [isEnabled, setIsEnabled] = useState(entry.schedule.isEnabled)
	const [backupHour, setBackupHour] = useState(entry.schedule.backupHour)
	const [backupMinute, setBackupMinute] = useState(entry.schedule.backupMinute)
	const [destinationPath, setDestinationPath] = useState(entry.schedule.destinationPath)
	const [fileNamePrefix, setFileNamePrefix] = useState(entry.schedule.fileNamePrefix)
	const [fileNameSuffix, setFileNameSuffix] = useState(entry.schedule.fileNameSuffix)
	const [retentionCount, setRetentionCount] = useState(entry.schedule.retentionCount)

	const showMessage = (text: string, type: 'success' | 'error') => {
		setMessage({ text, type })
		setTimeout(() => setMessage(null), 5000)
	}

	const localTimeEquivalent = useMemo(() => {
		const d = new Date()
		d.setUTCHours(backupHour, backupMinute, 0, 0)
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	}, [backupHour, backupMinute])

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
			const updated = await updateAdminUserSchedule(entry.userId, req)
			onUpdated(updated)
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
			await runAdminUserBackupNow(entry.userId)
			showMessage(t('backupSchedule.runNowStarted'), 'success')
		} catch {
			showMessage(t('backupSchedule.errorRunNow'), 'error')
		} finally {
			setRunningNow(false)
		}
	}

	const statusClass = (status: string) => {
		if (status === 'success') return 'backup-schedule__badge backup-schedule__badge--success'
		if (status === 'failed') return 'backup-schedule__badge backup-schedule__badge--error'
		if (status === 'running') return 'backup-schedule__badge backup-schedule__badge--running'
		return 'backup-schedule__badge backup-schedule__badge--never'
	}

	return (
		<div className='backup-schedule__user-row'>
			<button
				type='button'
				className='backup-schedule__user-row-header'
				onClick={() => setExpanded((v) => !v)}>
				<span className='backup-schedule__user-name'>{entry.username}</span>
				<span className={statusClass(entry.schedule.lastRunStatus)}>
					{t(`backupSchedule.status_${entry.schedule.lastRunStatus}`)}
				</span>
				<span className='backup-schedule__user-enabled'>
					{entry.schedule.isEnabled
						? t('backupScheduleAdmin.enabled')
						: t('backupScheduleAdmin.disabled')}
				</span>
				<span className='backup-schedule__user-chevron'>{expanded ? '▲' : '▼'}</span>
			</button>

			{expanded && (
				<div className='backup-schedule__user-body'>
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

					{entry.schedule.lastRunAt && (
						<div className='backup-schedule__status-card'>
							<h3>{t('backupSchedule.lastRunTitle')}</h3>
							<div className='backup-schedule__status-row'>
								<span className={statusClass(entry.schedule.lastRunStatus)}>
									{t(`backupSchedule.status_${entry.schedule.lastRunStatus}`)}
								</span>
								<span className='backup-schedule__status-date'>
									{new Date(entry.schedule.lastRunAt).toLocaleString()}
								</span>
							</div>
							{entry.schedule.lastRunMessage && (
								<p className='backup-schedule__status-message'>{entry.schedule.lastRunMessage}</p>
							)}
						</div>
					)}

					<form className='backup-schedule__form' onSubmit={handleSave}>
						<div className='backup-schedule__section'>
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
							</div>

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
									<span
										className='backup-schedule__time-local'
										title={t('backupSchedule.timeLocalTooltip')}>
										≈ {localTimeEquivalent} {t('backupSchedule.timeLocalShort')}
									</span>
								</div>
							</div>

							<div className='backup-schedule__field'>
								<label className='backup-schedule__label' htmlFor={`dest-${entry.userId}`}>
									{t('backupSchedule.destPathLabel')}
								</label>
								<input
									id={`dest-${entry.userId}`}
									type='text'
									value={destinationPath}
									onChange={(e) => setDestinationPath(e.target.value)}
									className='backup-schedule__input'
									placeholder='/backups'
								/>
							</div>

							<div className='backup-schedule__field'>
								<label className='backup-schedule__label' htmlFor={`prefix-${entry.userId}`}>
									{t('backupSchedule.fileNamePrefix')}
								</label>
								<input
									id={`prefix-${entry.userId}`}
									type='text'
									value={fileNamePrefix}
									onChange={(e) => setFileNamePrefix(e.target.value)}
									className='backup-schedule__input'
								/>
							</div>

							<div className='backup-schedule__field'>
								<label className='backup-schedule__label' htmlFor={`suffix-${entry.userId}`}>
									{t('backupSchedule.fileNameSuffix')}
								</label>
								<input
									id={`suffix-${entry.userId}`}
									type='text'
									value={fileNameSuffix}
									onChange={(e) => setFileNameSuffix(e.target.value)}
									className='backup-schedule__input'
								/>
							</div>

							<div className='backup-schedule__field'>
								<label className='backup-schedule__label' htmlFor={`retention-${entry.userId}`}>
									{t('backupSchedule.retentionLabel')}
								</label>
								<input
									id={`retention-${entry.userId}`}
									type='number'
									min={0}
									max={365}
									value={retentionCount}
									onChange={(e) => setRetentionCount(Number(e.target.value))}
									className='backup-schedule__input backup-schedule__input--short'
								/>
							</div>
						</div>

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
				</div>
			)}
		</div>
	)
}

const BackupScheduleAdmin: React.FC = () => {
	const { t } = useTranslation()
	const [users, setUsers] = useState<UserBackupScheduleDto[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const load = async () => {
			try {
				const data = await getAdminUserSchedules()
				setUsers(data)
			} catch {
				setError(t('backupSchedule.errorLoad'))
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [t])

	const handleUpdated = (updated: UserBackupScheduleDto) => {
		setUsers((prev) => prev.map((u) => (u.userId === updated.userId ? updated : u)))
	}

	if (loading) {
		return (
			<div className='backup-schedule'>
				<p>{t('common.loading')}</p>
			</div>
		)
	}

	if (error) {
		return (
			<div className='backup-schedule'>
				<p className='backup-schedule__alert backup-schedule__alert--error'>{error}</p>
			</div>
		)
	}

	return (
		<div className='backup-schedule'>
			<div className='backup-schedule__header'>
				<h1>{t('backupScheduleAdmin.title')}</h1>
				<p className='backup-schedule__subtitle'>{t('backupScheduleAdmin.subtitle')}</p>
			</div>

			<div className='backup-schedule__users-list'>
				{users.map((entry) => (
					<UserRow key={entry.userId} entry={entry} onUpdated={handleUpdated} />
				))}
			</div>
		</div>
	)
}

export default BackupScheduleAdmin
