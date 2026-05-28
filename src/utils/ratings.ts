export const formatUserRatingValue = (rating: number): string => {
	if (Number.isInteger(rating)) {
		return rating.toFixed(0)
	}

	return rating.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

export const formatUserRating = (rating: number): string => `${formatUserRatingValue(rating)}/10`
