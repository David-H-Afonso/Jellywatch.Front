import React from 'react'
import { useTranslation } from 'react-i18next'
import type { MediaType } from '@/models/api/Enums'
import { getExternalSearchLabel, getExternalSearchLink } from '@/utils/externalLinks'
import './ExternalManageLink.scss'

interface ExternalManageLinkProps {
	mediaType: MediaType
	title: string
	className?: string
}

/**
 * Quick-access link to manage a movie/series in Radarr/Sonarr.
 * Renders nothing when the matching service has no configured/enabled URL.
 */
export const ExternalManageLink: React.FC<ExternalManageLinkProps> = ({
	mediaType,
	title,
	className,
}) => {
	const { t } = useTranslation()
	const href = getExternalSearchLink(mediaType, title)
	if (!href) return null

	const label = t('externalLinks.openIn', { service: getExternalSearchLabel(mediaType) })

	return (
		<a
			className={className ?? 'external-manage-link'}
			href={href}
			target='_blank'
			rel='noreferrer'
			title={label}>
			{label}
		</a>
	)
}
