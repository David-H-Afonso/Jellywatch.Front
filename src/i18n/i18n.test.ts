import { describe, it, expect, beforeEach } from 'vitest'
import i18n from './index'

describe('i18n configuration', () => {
	beforeEach(async () => {
		await i18n.changeLanguage('en')
	})

	it('initializes with English as fallback language', () => {
		expect(i18n.options.fallbackLng).toContain('en')
	})

	it('supports English and Spanish languages', () => {
		expect(i18n.options.supportedLngs).toContain('en')
		expect(i18n.options.supportedLngs).toContain('es')
	})

	it('has interpolation escapeValue disabled for React', () => {
		expect(i18n.options.interpolation?.escapeValue).toBe(false)
	})

	it('can switch to Spanish', async () => {
		await i18n.changeLanguage('es')
		expect(i18n.language).toBe('es')
	})

	it('falls back to English for unsupported languages', async () => {
		await i18n.changeLanguage('fr')
		// When supportedLngs is set, i18next resolves to fallback
		expect(i18n.language).toBe('en')
	})

	it('uses localStorage in detection order', () => {
		const detection = i18n.options.detection as { order?: string[] }
		expect(detection?.order).toContain('localStorage')
	})

	it('caches language selection in localStorage', () => {
		const detection = i18n.options.detection as { caches?: string[] }
		expect(detection?.caches).toContain('localStorage')
	})
})
