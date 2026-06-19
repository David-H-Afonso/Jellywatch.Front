import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getMediaAvailability } from '@/services'
import type { MediaAvailabilityDto } from '@/models/api'
import './AvailabilityBadge.scss'

interface Props {
	mediaItemId: number
}

export const AvailabilityBadge: React.FC<Props> = ({ mediaItemId }) => {
	const { t } = useTranslation()
	const [availability, setAvailability] = useState<MediaAvailabilityDto | null>(null)
	const [configured, setConfigured] = useState(false)
	const [loaded, setLoaded] = useState(false)

	useEffect(() => {
		let cancelled = false
		const fetchAvailability = async () => {
			try {
				const data = await getMediaAvailability(mediaItemId)
				if (!cancelled) {
					setConfigured(data.configured)
					setAvailability(data.availability)
					setLoaded(true)
				}
			} catch {
				if (!cancelled) setLoaded(true)
			}
		}
		fetchAvailability()
		return () => {
			cancelled = true
		}
	}, [mediaItemId])

	if (!loaded || !configured) return null
	if (!availability) return null

	const source = availability.source === 'radarr' ? 'Radarr' : 'Sonarr'

	if (availability.isAvailable) {
		const sizeLabel = availability.sizeMb
			? availability.sizeMb >= 1024
				? `${(availability.sizeMb / 1024).toFixed(1)} GB`
				: `${availability.sizeMb} MB`
			: null
		const episodeLabel =
			availability.episodeFileCount != null && availability.totalEpisodeCount != null
				? `${availability.episodeFileCount}/${availability.totalEpisodeCount}`
				: null

		return (
			<span className='availability-badge availability-badge--available' title={source}>
				<svg viewBox='0 0 24 24' aria-hidden='true'>
					<path d='M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z' />
				</svg>
				{t('availability.downloaded')}
				{episodeLabel && <span className='availability-badge__detail'>{episodeLabel}</span>}
				{sizeLabel && <span className='availability-badge__detail'>{sizeLabel}</span>}
			</span>
		)
	}

	if (availability.isMonitored) {
		return (
			<span className='availability-badge availability-badge--monitored' title={source}>
				<svg viewBox='0 0 24 24' aria-hidden='true'>
					<path d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z' />
				</svg>
				{t('availability.monitored')}
			</span>
		)
	}

	return (
		<span className='availability-badge availability-badge--missing' title={source}>
			{t('availability.notDownloaded')}
		</span>
	)
}
