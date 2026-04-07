import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PosterOptionDto } from '@/models/api'
import {
	getPosterOptions,
	selectPoster,
	getLogoOptions,
	selectLogo,
} from '@/services/AdminService/AdminService'
import './PosterPickerModal.scss'

interface Props {
	mediaItemId: number
	type?: 'poster' | 'logo'
	onClose: () => void
	onSelected: () => void
}

export const PosterPickerModal: React.FC<Props> = ({
	mediaItemId,
	type = 'poster',
	onClose,
	onSelected,
}) => {
	const { t } = useTranslation()
	const [options, setOptions] = useState<PosterOptionDto[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		let cancelled = false
		setLoading(true)
		const fetcher = type === 'logo' ? getLogoOptions : getPosterOptions
		fetcher(mediaItemId)
			.then((data) => {
				if (!cancelled) {
					setOptions(data)
					setLoading(false)
				}
			})
			.catch(() => {
				if (!cancelled) setLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [mediaItemId, type])

	const handleConfirm = async () => {
		if (!selectedUrl) return
		setSaving(true)
		try {
			if (type === 'logo') {
				await selectLogo(mediaItemId, selectedUrl)
			} else {
				await selectPoster(mediaItemId, selectedUrl)
			}
			onSelected()
		} finally {
			setSaving(false)
		}
	}

	const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) onClose()
	}

	const title = type === 'logo' ? t('admin.logoPicker') : t('admin.posterPicker')
	const loadingText =
		type === 'logo' ? t('admin.logoPickerLoading') : t('admin.posterPickerLoading')
	const noneText = type === 'logo' ? t('admin.logoPickerNone') : t('admin.posterPickerNone')

	return (
		<div className='poster-picker-overlay' onClick={handleOverlayClick}>
			<div className='poster-picker-modal'>
				<div className='poster-picker-modal__header'>
					<h2>{title}</h2>
					<button className='poster-picker-modal__close' onClick={onClose} aria-label='Close'>
						✕
					</button>
				</div>

				<div className='poster-picker-modal__body'>
					{loading && <p className='poster-picker-modal__status'>{loadingText}</p>}
					{!loading && options.length === 0 && (
						<p className='poster-picker-modal__status'>{noneText}</p>
					)}
					{!loading && options.length > 0 && (
						<div
							className={`poster-picker-modal__grid${type === 'logo' ? ' poster-picker-modal__grid--logo' : ''}`}>
							{options.map((opt) => (
								<button
									key={opt.id}
									className={`poster-picker-modal__option${type === 'logo' ? ' poster-picker-modal__option--logo' : ''}${selectedUrl === opt.remoteUrl ? ' poster-picker-modal__option--selected' : ''}`}
									onClick={() => setSelectedUrl(opt.remoteUrl)}>
									<img src={opt.thumbnailUrl} alt={`${type} option`} loading='lazy' />
									<span className='poster-picker-modal__lang'>
										{opt.language ? opt.language.toUpperCase() : '—'}
									</span>
								</button>
							))}
						</div>
					)}
				</div>

				<div className='poster-picker-modal__footer'>
					<button className='btn-secondary btn-sm' onClick={onClose}>
						{t('admin.posterPickerCancel')}
					</button>
					<button
						className='btn-primary btn-sm'
						onClick={handleConfirm}
						disabled={!selectedUrl || saving}>
						{saving ? '...' : t('admin.posterPickerConfirm')}
					</button>
				</div>
			</div>
		</div>
	)
}
