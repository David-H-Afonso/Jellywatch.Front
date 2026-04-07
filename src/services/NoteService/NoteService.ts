import { customFetch } from '@/utils/customFetch'
import { environment } from '@/environments'
import type { NoteDto, NoteCreateUpdateDto } from '@/models/api'

const { apiRoutes } = environment

export const getNotes = async (
	profileId: number,
	params?: { mediaItemId?: number; seasonId?: number; episodeId?: number }
): Promise<NoteDto[]> => {
	return await customFetch<NoteDto[]>(apiRoutes.notes.base(profileId), {
		method: 'GET',
		params: params as Record<string, string | number | boolean>,
	})
}

export const createOrUpdateNote = async (
	profileId: number,
	data: NoteCreateUpdateDto
): Promise<NoteDto> => {
	return await customFetch<NoteDto>(apiRoutes.notes.base(profileId), {
		method: 'PUT',
		body: data,
	})
}

export const deleteNote = async (profileId: number, noteId: number): Promise<void> => {
	await customFetch<void>(apiRoutes.notes.byId(profileId, noteId), {
		method: 'DELETE',
	})
}
