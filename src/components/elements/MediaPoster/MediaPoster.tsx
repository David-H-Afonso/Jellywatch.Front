import React, { useState } from 'react'
import { environment } from '@/environments'
import './MediaPoster.scss'

interface Props {
	mediaItemId: number | null
	imageType?: string
	alt: string
	className?: string
	fallback?: string
}

export const MediaPoster: React.FC<Props> = ({
	mediaItemId,
	imageType = 'Poster',
	alt,
	className = '',
	fallback = '🎬',
}) => {
	const [hasError, setHasError] = useState(false)

	if (!mediaItemId || hasError) {
		return (
			<div className={`media-poster media-poster--fallback ${className}`}>
				<span className='media-poster__emoji'>{fallback}</span>
			</div>
		)
	}

	const src = `${environment.baseUrl}${environment.apiRoutes.asset.image(mediaItemId, imageType)}`

	return (
		<img
			className={`media-poster ${className}`}
			src={src}
			alt={alt}
			loading='lazy'
			onError={() => setHasError(true)}
		/>
	)
}
