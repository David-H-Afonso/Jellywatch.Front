import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createNoteDto } from '@/test/factories'
import * as NoteService from '@/services/NoteService/NoteService'

const API = 'http://localhost:5011'

describe('Notes flow', () => {
	const profileId = 10

	describe('getNotes', () => {
		it('fetches all notes for a profile', async () => {
			const mockNotes = [
				createNoteDto({ id: 1, text: 'First note' }),
				createNoteDto({ id: 2, text: 'Second note' }),
			]
			server.use(
				http.get(`${API}/api/profiles/:profileId/notes`, () => HttpResponse.json(mockNotes))
			)

			const result = await NoteService.getNotes(profileId)
			expect(result).toHaveLength(2)
			expect(result[0].text).toBe('First note')
			expect(result[1].text).toBe('Second note')
		})

		it('fetches notes filtered by mediaItemId', async () => {
			const mockNotes = [createNoteDto({ id: 1, mediaItemId: 42 })]
			server.use(
				http.get(`${API}/api/profiles/:profileId/notes`, ({ request }) => {
					const url = new URL(request.url)
					expect(url.searchParams.get('mediaItemId')).toBe('42')
					return HttpResponse.json(mockNotes)
				})
			)

			const result = await NoteService.getNotes(profileId, { mediaItemId: 42 })
			expect(result).toHaveLength(1)
			expect(result[0].mediaItemId).toBe(42)
		})

		it('returns empty array when no notes exist', async () => {
			server.use(http.get(`${API}/api/profiles/:profileId/notes`, () => HttpResponse.json([])))

			const result = await NoteService.getNotes(profileId)
			expect(result).toEqual([])
		})

		it('handles server error on fetch', async () => {
			server.use(
				http.get(`${API}/api/profiles/:profileId/notes`, () =>
					HttpResponse.json({ message: 'Server Error' }, { status: 500 })
				)
			)

			await expect(NoteService.getNotes(profileId)).rejects.toThrow('500')
		})
	})

	describe('createOrUpdateNote', () => {
		it('creates a new note', async () => {
			const created = createNoteDto({ id: 99, text: 'New note' })
			server.use(http.put(`${API}/api/profiles/:profileId/notes`, () => HttpResponse.json(created)))

			const result = await NoteService.createOrUpdateNote(profileId, {
				mediaItemId: 1,
				text: 'New note',
			})
			expect(result.id).toBe(99)
			expect(result.text).toBe('New note')
		})

		it('sends the correct body to the API', async () => {
			const noteData = { mediaItemId: 5, seasonId: 2, episodeId: 10, text: 'Episode note' }
			let capturedBody: unknown
			server.use(
				http.put(`${API}/api/profiles/:profileId/notes`, async ({ request }) => {
					capturedBody = await request.json()
					return HttpResponse.json(createNoteDto(noteData))
				})
			)

			await NoteService.createOrUpdateNote(profileId, noteData)
			expect(capturedBody).toEqual(noteData)
		})

		it('handles validation error', async () => {
			server.use(
				http.put(`${API}/api/profiles/:profileId/notes`, () =>
					HttpResponse.json({ message: 'Text is required' }, { status: 400 })
				)
			)

			await expect(
				NoteService.createOrUpdateNote(profileId, { mediaItemId: 1, text: '' })
			).rejects.toThrow('400')
		})
	})

	describe('deleteNote', () => {
		it('deletes a note successfully', async () => {
			server.use(
				http.delete(
					`${API}/api/profiles/:profileId/notes/:noteId`,
					() => new HttpResponse(null, { status: 204 })
				)
			)

			await expect(NoteService.deleteNote(profileId, 5)).resolves.toBeUndefined()
		})

		it('handles not found error on delete', async () => {
			server.use(
				http.delete(`${API}/api/profiles/:profileId/notes/:noteId`, () =>
					HttpResponse.json({ message: 'Not found' }, { status: 404 })
				)
			)

			await expect(NoteService.deleteNote(profileId, 999)).rejects.toThrow('404')
		})
	})
})
