import { customFetch } from '@/utils/customFetch'
import { environment } from '@/environments'

const { apiRoutes } = environment

export interface BackupScheduleDto {
	isEnabled: boolean
	backupHour: number
	backupMinute: number
	destinationPath: string
	fileNamePrefix: string
	fileNameSuffix: string
	retentionCount: number
	lastRunAt: string | null
	lastRunStatus: 'never' | 'running' | 'success' | 'failed'
	lastRunMessage: string | null
}

export interface UpdateBackupScheduleRequest {
	isEnabled: boolean
	backupHour: number
	backupMinute: number
	destinationPath: string
	fileNamePrefix: string
	fileNameSuffix: string
	retentionCount: number
}

export const getBackupSchedule = async (): Promise<BackupScheduleDto> => {
	return await customFetch<BackupScheduleDto>(apiRoutes.backupSchedule.base)
}

export const updateBackupSchedule = async (
	req: UpdateBackupScheduleRequest
): Promise<BackupScheduleDto> => {
	return await customFetch<BackupScheduleDto>(apiRoutes.backupSchedule.base, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(req),
	})
}

export const runBackupNow = async (): Promise<void> => {
	await customFetch<unknown>(apiRoutes.backupSchedule.runNow, { method: 'POST' })
}
