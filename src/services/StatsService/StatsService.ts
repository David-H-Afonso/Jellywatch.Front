import { customFetch } from '@/utils/customFetch'
import { environment } from '@/environments'
import type {
	WrappedDto,
	CalendarDayDto,
	ImportPreviewDto,
	ImportResultDto,
	UpcomingEpisodeDto,
} from '@/models/api'

const { apiRoutes } = environment

export const getWrapped = async (profileId: number, year?: number): Promise<WrappedDto> => {
	return await customFetch<WrappedDto>(apiRoutes.stats.wrapped(profileId), {
		params: year !== undefined ? { year } : undefined,
	})
}

export const getCalendar = async (
	profileId: number,
	year: number,
	month: number
): Promise<CalendarDayDto[]> => {
	return await customFetch<CalendarDayDto[]>(apiRoutes.stats.calendar(profileId), {
		params: { year, month },
	})
}

export type ExportType = 'full' | 'partial'

export interface ExportOptions {
	prefix?: string
	suffix?: string
	exportType?: ExportType
}

export const buildExportFileName = (options: ExportOptions = {}): string => {
	const { prefix = '', suffix = '', exportType = 'full' } = options
	const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
	const parts = [prefix.trim(), date, exportType]
	if (suffix.trim()) parts.push(suffix.trim())
	return `${parts.filter(Boolean).join('-')}.csv`
}

export const exportData = async (profileId: number, options: ExportOptions = {}): Promise<void> => {
	const response = await customFetch<Blob>(apiRoutes.data.export(profileId))
	const blob =
		response instanceof Blob ? response : new Blob([String(response)], { type: 'text/csv' })
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = buildExportFileName(options)
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}

export const getUpcoming = async (
	profileId: number,
	days: number = 30
): Promise<UpcomingEpisodeDto[]> => {
	return await customFetch<UpcomingEpisodeDto[]>(apiRoutes.stats.upcoming(profileId), {
		params: { days },
	})
}

export const importPreview = async (profileId: number, file: File): Promise<ImportPreviewDto> => {
	const formData = new FormData()
	formData.append('file', file)
	return await customFetch<ImportPreviewDto>(apiRoutes.data.importPreview(profileId), {
		method: 'POST',
		body: formData,
	})
}

export const importData = async (
	profileId: number,
	file: File,
	skipDuplicates: boolean = true,
	overwriteDates: boolean = false
): Promise<ImportResultDto> => {
	const formData = new FormData()
	formData.append('file', file)
	return await customFetch<ImportResultDto>(apiRoutes.data.import(profileId), {
		method: 'POST',
		body: formData,
		params: { skipDuplicates, overwriteDates },
	})
}
