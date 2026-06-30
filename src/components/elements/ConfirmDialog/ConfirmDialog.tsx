import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './ConfirmDialog.scss'

interface ConfirmDialogProps {
	title: string
	message: string
	confirmLabel: string
	cancelLabel?: string
	tone?: 'danger' | 'primary'
	busy?: boolean
	onConfirm: () => void
	onCancel: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
	title,
	message,
	confirmLabel,
	cancelLabel,
	tone = 'danger',
	busy = false,
	onConfirm,
	onCancel,
}) => {
	const { t } = useTranslation()
	const cancelRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		cancelRef.current?.focus()
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onCancel()
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [onCancel])

	return (
		<div
			className='confirm-dialog-overlay'
			onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
			<div className='confirm-dialog' role='alertdialog' aria-modal='true' aria-label={title}>
				<h2 className='confirm-dialog__title'>{title}</h2>
				<p className='confirm-dialog__message'>{message}</p>
				<div className='confirm-dialog__actions'>
					<button
						ref={cancelRef}
						type='button'
						className='btn-secondary btn-sm'
						onClick={onCancel}
						disabled={busy}>
						{cancelLabel ?? t('common.cancel')}
					</button>
					<button
						type='button'
						className={`${tone === 'danger' ? 'btn-danger' : 'btn-primary'} btn-sm`}
						onClick={onConfirm}
						disabled={busy}>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	)
}
