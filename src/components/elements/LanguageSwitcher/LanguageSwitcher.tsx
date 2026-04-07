import React from 'react'
import { useTranslation } from 'react-i18next'
import './LanguageSwitcher.scss'

export const LanguageSwitcher: React.FC = () => {
	const { i18n } = useTranslation()

	const toggleLanguage = () => {
		const next = i18n.language === 'es' ? 'en' : 'es'
		i18n.changeLanguage(next)
	}

	return (
		<button
			className='language-switcher'
			onClick={toggleLanguage}
			title={i18n.language === 'es' ? 'Cambiar a Español' : 'Switch to English'}>
			{i18n.language === 'es' ? 'ES' : 'EN'}
		</button>
	)
}
