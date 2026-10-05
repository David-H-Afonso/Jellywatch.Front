import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customFetch } = vi.hoisted(() => ({ customFetch: vi.fn() }))
vi.mock('@/utils/customFetch', () => ({ customFetch }))

import { apiRoutes } from '@/environments/apiRoutes'
import { disablePush, getPushStatus } from './NotificationService'

describe('NotificationService', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true })
		Object.defineProperty(window, 'PushManager', { configurable: true, value: class PushManager {} })
		Object.defineProperty(globalThis, 'Notification', { configurable: true, value: class Notification { static permission = 'default' } })
		Object.defineProperty(navigator, 'serviceWorker', {
			configurable: true,
			value: { getRegistration: vi.fn().mockResolvedValue(undefined) },
		})
	})

	it('reports unsupported where Web Push is unavailable', async () => {
		const originalSecureContext = window.isSecureContext
		Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false })
		await expect(getPushStatus()).resolves.toBe('unsupported')
		expect(customFetch).not.toHaveBeenCalled()
		Object.defineProperty(window, 'isSecureContext', { configurable: true, value: originalSecureContext })
	})

	it('reports server-disabled state without requesting browser permission', async () => {
		customFetch.mockResolvedValue({ enabled: false, publicKey: null })
		await expect(getPushStatus()).resolves.toBe('disabled')
		expect(customFetch).toHaveBeenCalledWith(apiRoutes.notifications.config)
	})

	it('keeps enable available when server VAPID configuration is missing', async () => {
		customFetch.mockRejectedValue(new Error('missing configuration'))
		await expect(getPushStatus()).resolves.toBe('ready')
	})

	it('reports a registered and active device subscription as enabled', async () => {
		const subscription = { endpoint: 'https://push.test/device' }
		const registration = { pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) } }
		navigator.serviceWorker.getRegistration = vi.fn().mockResolvedValue(registration as unknown as ServiceWorkerRegistration)
		customFetch.mockResolvedValueOnce({ enabled: true, publicKey: 'public' }).mockResolvedValueOnce({ active: true })

		await expect(getPushStatus()).resolves.toBe('enabled')
		expect(customFetch).toHaveBeenLastCalledWith(apiRoutes.notifications.subscriptionStatus, {
			method: 'POST', body: { endpoint: subscription.endpoint },
		})
	})

	it('keeps local unsubscribe available if the API subscription endpoint has gone away', async () => {
		const unsubscribe = vi.fn().mockResolvedValue(true)
		const subscription = { endpoint: 'https://push.test/device', unsubscribe }
		const registration = { pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) } }
		navigator.serviceWorker.getRegistration = vi.fn().mockResolvedValue(registration as unknown as ServiceWorkerRegistration)
		customFetch.mockRejectedValue(new Error('server unavailable'))

		await expect(disablePush()).rejects.toThrow('server unavailable')

		expect(unsubscribe).toHaveBeenCalledOnce()
	})
})
