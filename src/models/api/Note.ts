export interface NoteDto {
	id: number
	mediaItemId: number
	seasonId: number | null
	episodeId: number | null
	text: string
	createdAt: string
	updatedAt: string
}

export interface NoteCreateUpdateDto {
	mediaItemId: number
	seasonId?: number | null
	episodeId?: number | null
	text: string
}
