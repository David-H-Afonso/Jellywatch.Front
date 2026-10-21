import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MediaType } from '@/models/api/Enums'
import type { BulkMetadataFailureDto } from '@/services/AdminService/AdminService'
import './MetadataFailuresModal.scss'

interface Props {
	failures: BulkMetadataFailureDto[]
	failedCount: number
	onClose: () => void
}

const MetadataFailuresModal: React.FC<Props> = ({ failures, failedCount, onClose }) => {
	const { t } = useTranslation()
	const dialogRef = useRef<HTMLElement>(null)
	const closeButtonRef = useRef<HTMLButtonElement>(null)
	const previousFocusRef = useRef<HTMLElement | null>(null)
	const onCloseRef = useRef(onClose)
	onCloseRef.current = onClose

	useEffect(() => {
		previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
		closeButtonRef.current?.focus()

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault()
				onCloseRef.current()
				return
			}
			if (event.key !== 'Tab') return

			const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
				'button:not([disabled]), a[href]'
				)
			if (!focusable?.length) return
			const first = focusable[0]
			const last = focusable[focusable.length - 1]
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault()
				last.focus()
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault()
				first.focus()
			}
		}

		document.addEventListener('keydown', onKeyDown)
		return () => {
			document.removeEventListener('keydown', onKeyDown)
			previousFocusRef.current?.focus()
		}
	}, [])

	const getDetailPath = (failure: BulkMetadataFailureDto) => {
		if (failure.mediaType === MediaType.Movie && failure.movieId) return `/movies/${failure.movieId}`
		if (failure.mediaType === MediaType.Series && failure.seriesId) return `/series/${failure.seriesId}`
		return null
	}

	const getMediaTypeLabel = (failure: BulkMetadataFailureDto) => {
		if (failure.mediaType === MediaType.Movie) return t('movies.title')
		if (failure.mediaType === MediaType.Series) return t('series.title')
		return t('admin.unknownMediaType')
	}

	return (
		<div
			className='metadata-failures-overlay'
			onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
			<section
				ref={dialogRef}
				className='metadata-failures-dialog'
				role='dialog'
				aria-modal='true'
				aria-labelledby='metadata-failures-title'
				tabIndex={-1}>
				<header className='metadata-failures-dialog__header'>
					<div>
						<h2 id='metadata-failures-title'>{t('admin.metadataFailuresTitle')}</h2>
						<p>{t('admin.metadataFailureCount', { count: failedCount })}</p>
					</div>
					<button
						ref={closeButtonRef}
						type='button'
						className='metadata-failures-dialog__close'
						aria-label={t('common.close')}
						onClick={onClose}>
						×
					</button>
				</header>

				{failures.length > 0 ? (
					<ul className='metadata-failures-dialog__list'>
						{failures.map((failure, index) => {
							const path = getDetailPath(failure)
							return (
								<li key={`${failure.mediaItemId}-${index}`} className='metadata-failure-item'>
									<div className='metadata-failure-item__heading'>
										{path ? (
											<Link to={path} onClick={onClose}>
												{failure.mediaTitle}
											</Link>
										) : (
											<strong>{failure.mediaTitle}</strong>
										)}
										<span>{getMediaTypeLabel(failure)}</span>
									</div>
									<p>{failure.error}</p>
								</li>
							)
						})}
					</ul>
				) : (
					<p className='metadata-failures-dialog__empty'>{t('admin.metadataFailureNoDetails')}</p>
				)}

				{failures.length < failedCount && (
					<p className='metadata-failures-dialog__note'>
						{t('admin.metadataFailureDetailsMissing', {
							available: failures.length,
							total: failedCount,
						})}
					</p>
				)}
			</section>
		</div>
	)
}

export default MetadataFailuresModal
