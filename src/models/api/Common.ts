export interface PagedResult<T> {
	data: T[]
	totalCount: number
	page: number
	pageSize: number
	totalPages: number
}

export interface QueryParameters {
	page?: number
	pageSize?: number
	search?: string
	sortBy?: string
	sortDescending?: boolean
}

export interface MediaQueryParameters extends QueryParameters {
	state?: string
	profileId?: number
	genre?: string
	actor?: string
	director?: string
}

export interface MediaFilterOptionsDto {
	genres: string[]
	actors: string[]
	directors: string[]
}

export interface ActivityQueryParameters extends QueryParameters {
	mediaType?: string
	mediaItemId?: number
	dateFrom?: string
	dateTo?: string
}
