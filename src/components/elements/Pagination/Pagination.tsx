import React from 'react'
import { useTranslation } from 'react-i18next'
import './Pagination.scss'

interface Props {
	page: number
	totalPages: number
	totalCount: number
	onPageChange: (page: number) => void
}

export const Pagination: React.FC<Props> = ({ page, totalPages, totalCount, onPageChange }) => {
	const { t } = useTranslation()

	if (totalPages <= 1) return null

	return (
		<div className='pagination'>
			<span className='pagination__info'>
				{t('common.showing')} {totalCount} {t('common.items')}
			</span>
			<div className='pagination__controls'>
				<button
					className='pagination__btn'
					disabled={page <= 1}
					onClick={() => onPageChange(page - 1)}>
					←
				</button>
				<span className='pagination__current'>
					{t('common.page')} {page} {t('common.of')} {totalPages}
				</span>
				<button
					className='pagination__btn'
					disabled={page >= totalPages}
					onClick={() => onPageChange(page + 1)}>
					→
				</button>
			</div>
		</div>
	)
}
