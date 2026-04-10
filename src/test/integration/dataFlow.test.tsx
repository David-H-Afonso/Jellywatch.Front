import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import * as StatsService from '@/services/StatsService/StatsService'

const API = 'http://localhost:5011'

describe('Data import/export flow', () => {
	const profileId = 10

	describe('exportData', () => {
		let createObjectURLSpy: ReturnType<typeof vi.spyOn>
		let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>

		beforeEach(() => {
			createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
			revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
		})

		it('exports data as CSV and triggers download', async () => {
			const csvContent = 'title,date,state\nBreaking Bad,2024-01-01,Seen'
			server.use(
				http.get(
					`${API}/api/data/:profileId/export`,
					() =>
						new HttpResponse(csvContent, {
							headers: { 'Content-Type': 'text/csv' },
						})
				)
			)

			const clickSpy = vi.fn()
			const originalCreateElement = document.createElement.bind(document)
			vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
				const el = originalCreateElement(tag)
				if (tag === 'a') {
					vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(clickSpy)
				}
				return el
			})

			await StatsService.exportData(profileId)

			expect(createObjectURLSpy).toHaveBeenCalledOnce()
			expect(clickSpy).toHaveBeenCalledOnce()
			expect(revokeObjectURLSpy).toHaveBeenCalledOnce()
		})

		it('handles export server error', async () => {
			server.use(
				http.get(`${API}/api/data/:profileId/export`, () =>
					HttpResponse.json({ message: 'Export failed' }, { status: 500 })
				)
			)

			await expect(StatsService.exportData(profileId)).rejects.toThrow('500')
		})
	})

	describe('importPreview', () => {
		it('returns preview with valid/duplicate/notFound counts', async () => {
			const previewResponse = {
				totalRows: 10,
				validRows: 8,
				duplicateRows: 1,
				notFoundRows: 1,
				errors: [],
				rows: [],
			}
			server.use(
				http.post(`${API}/api/data/:profileId/import/preview`, () =>
					HttpResponse.json(previewResponse)
				)
			)

			const file = new File(['csv-content'], 'import.csv', { type: 'text/csv' })
			const result = await StatsService.importPreview(profileId, file)

			expect(result.totalRows).toBe(10)
			expect(result.validRows).toBe(8)
			expect(result.duplicateRows).toBe(1)
			expect(result.notFoundRows).toBe(1)
		})

		it('sends file as FormData', async () => {
			let receivedContentType = ''
			server.use(
				http.post(`${API}/api/data/:profileId/import/preview`, ({ request }) => {
					receivedContentType = request.headers.get('content-type') ?? ''
					return HttpResponse.json({
						totalRows: 0,
						validRows: 0,
						duplicateRows: 0,
						notFoundRows: 0,
						errors: [],
						rows: [],
					})
				})
			)

			const file = new File(['data'], 'test.csv', { type: 'text/csv' })
			await StatsService.importPreview(profileId, file)

			expect(receivedContentType).toContain('multipart/form-data')
		})

		it('handles preview validation error', async () => {
			server.use(
				http.post(`${API}/api/data/:profileId/import/preview`, () =>
					HttpResponse.json({ message: 'Invalid CSV format' }, { status: 400 })
				)
			)

			const file = new File(['invalid'], 'bad.csv', { type: 'text/csv' })
			await expect(StatsService.importPreview(profileId, file)).rejects.toThrow('400')
		})
	})

	describe('importData', () => {
		it('imports data with default options', async () => {
			server.use(
				http.post(`${API}/api/data/:profileId/import`, ({ request }) => {
					const url = new URL(request.url)
					expect(url.searchParams.get('skipDuplicates')).toBe('true')
					expect(url.searchParams.get('overwriteDates')).toBe('false')
					return HttpResponse.json({ imported: 8, skipped: 2, errors: [] })
				})
			)

			const file = new File(['csv-data'], 'import.csv', { type: 'text/csv' })
			const result = await StatsService.importData(profileId, file)

			expect(result.imported).toBe(8)
			expect(result.skipped).toBe(2)
			expect(result.errors).toEqual([])
		})

		it('imports data with custom options', async () => {
			server.use(
				http.post(`${API}/api/data/:profileId/import`, ({ request }) => {
					const url = new URL(request.url)
					expect(url.searchParams.get('skipDuplicates')).toBe('false')
					expect(url.searchParams.get('overwriteDates')).toBe('true')
					return HttpResponse.json({ imported: 10, skipped: 0, errors: [] })
				})
			)

			const file = new File(['csv-data'], 'import.csv', { type: 'text/csv' })
			const result = await StatsService.importData(profileId, file, false, true)

			expect(result.imported).toBe(10)
			expect(result.skipped).toBe(0)
		})

		it('handles import server error', async () => {
			server.use(
				http.post(`${API}/api/data/:profileId/import`, () =>
					HttpResponse.json({ message: 'Import failed' }, { status: 500 })
				)
			)

			const file = new File(['data'], 'import.csv', { type: 'text/csv' })
			await expect(StatsService.importData(profileId, file)).rejects.toThrow('500')
		})

		it('returns errors for partial import', async () => {
			server.use(
				http.post(`${API}/api/data/:profileId/import`, () =>
					HttpResponse.json({
						imported: 5,
						skipped: 3,
						errors: ['Row 3: Unknown series', 'Row 7: Invalid date'],
					})
				)
			)

			const file = new File(['data'], 'import.csv', { type: 'text/csv' })
			const result = await StatsService.importData(profileId, file)

			expect(result.imported).toBe(5)
			expect(result.errors).toHaveLength(2)
		})
	})

	describe('getUpcoming', () => {
		it('fetches upcoming episodes for a profile', async () => {
			server.use(
				http.get(`${API}/api/stats/:profileId/upcoming`, () =>
					HttpResponse.json([
						{
							mediaItemId: 1,
							seriesId: 1,
							seriesTitle: 'Breaking Bad',
							seasonNumber: 2,
							episodeNumber: 5,
							episodeName: 'Breakage',
							airDate: '2025-02-01',
							airTime: null,
							airTimeUtc: null,
							batchCount: 1,
						},
					])
				)
			)

			const result = await StatsService.getUpcoming(profileId)
			expect(result).toHaveLength(1)
			expect(result[0].seriesTitle).toBe('Breaking Bad')
		})

		it('sends days parameter', async () => {
			server.use(
				http.get(`${API}/api/stats/:profileId/upcoming`, ({ request }) => {
					const url = new URL(request.url)
					expect(url.searchParams.get('days')).toBe('7')
					return HttpResponse.json([])
				})
			)

			const result = await StatsService.getUpcoming(profileId, 7)
			expect(result).toEqual([])
		})

		it('defaults to 30 days', async () => {
			server.use(
				http.get(`${API}/api/stats/:profileId/upcoming`, ({ request }) => {
					const url = new URL(request.url)
					expect(url.searchParams.get('days')).toBe('30')
					return HttpResponse.json([])
				})
			)

			await StatsService.getUpcoming(profileId)
		})
	})
})
