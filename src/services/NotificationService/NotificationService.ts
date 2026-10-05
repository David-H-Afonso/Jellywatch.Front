import { apiRoutes } from '@/environments/apiRoutes'
import { customFetch } from '@/utils/customFetch'

export type PushConfig = { enabled: boolean; publicKey: string | null }
export type NotificationPreferences = { seasonUpdates: boolean }
export type PushSubscriptionRequest = { endpoint: string; p256dh: string; auth: string; deviceName?: string }

export const isPushSupported = (): boolean =>
	typeof window !== 'undefined'
	&& window.isSecureContext
	&& 'Notification' in window
	&& 'serviceWorker' in navigator
	&& 'PushManager' in window

export const getPushConfig = (): Promise<PushConfig> => customFetch<PushConfig>(apiRoutes.notifications.config)
export const getNotificationPreferences = (): Promise<NotificationPreferences> =>
	customFetch<NotificationPreferences>(apiRoutes.notifications.preferences)
export const setNotificationPreferences = (seasonUpdates: boolean): Promise<NotificationPreferences> =>
	customFetch<NotificationPreferences>(apiRoutes.notifications.preferences, {
		method: 'PUT',
		body: { seasonUpdates },
	})

export const enablePush = async (): Promise<void> => {
	if (!isPushSupported()) throw new Error('push_unsupported')
	const config = await getPushConfig()
	if (!config.enabled || !config.publicKey) throw new Error('push_disabled')
	if (Notification.permission === 'denied') throw new Error('push_denied')
	const permission = await Notification.requestPermission()
	if (permission !== 'granted') throw new Error('push_denied')
	const registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
	let subscription = await registration.pushManager.getSubscription()
	if (!subscription) {
		subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: decodeVapidKey(config.publicKey),
		})
	}
	const p256dh = subscription.getKey('p256dh')
	const auth = subscription.getKey('auth')
	if (!p256dh || !auth) throw new Error('push_invalid_subscription')
	const request: PushSubscriptionRequest = {
		endpoint: subscription.endpoint,
		p256dh: encodeBase64Url(p256dh),
		auth: encodeBase64Url(auth),
		deviceName: navigator.userAgent.slice(0, 200),
	}
	try {
		await customFetch<{ enabled: boolean }>(apiRoutes.notifications.subscription, {
			method: 'POST',
			body: request,
		})
	} catch (error) {
		// A browser subscription is device-scoped. If the Jellywatch account changed,
		// release the previous endpoint and create a fresh endpoint for the new account.
		const isConflict = error instanceof Error && (error.message.includes('HTTP 409') || error.message.includes('another user'))
		if (!isConflict) throw error
		await subscription.unsubscribe()
		subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: decodeVapidKey(config.publicKey),
		})
		const nextP256dh = subscription.getKey('p256dh')
		const nextAuth = subscription.getKey('auth')
		if (!nextP256dh || !nextAuth) throw new Error('push_invalid_subscription')
		await customFetch<{ enabled: boolean }>(apiRoutes.notifications.subscription, {
			method: 'POST',
			body: {
				endpoint: subscription.endpoint,
				p256dh: encodeBase64Url(nextP256dh),
				auth: encodeBase64Url(nextAuth),
				deviceName: navigator.userAgent.slice(0, 200),
			},
		})
	}
}

export const disablePush = async (): Promise<void> => {
	if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
	const registration = await navigator.serviceWorker.getRegistration('/')
	const subscription = await registration?.pushManager.getSubscription()
	if (!subscription) return
	try {
		await customFetch<void>(apiRoutes.notifications.subscription, {
			method: 'DELETE',
			body: { endpoint: subscription.endpoint },
		})
	} finally {
		// Browser-side opt-out must still work if the API is temporarily unreachable.
		await subscription.unsubscribe()
	}
}

export const getPushStatus = async (): Promise<'unsupported' | 'disabled' | 'denied' | 'enabled' | 'ready'> => {
	if (!isPushSupported()) return 'unsupported'
	if (Notification.permission === 'denied') return 'denied'
	let config: PushConfig
	try {
		config = await getPushConfig()
	} catch {
		// Keep initial opt-in visible even before the server has its VAPID keys configured.
		return 'ready'
	}
	if (!config.enabled) return 'disabled'
	if (!config.publicKey) return 'ready'
	const subscription = await (await navigator.serviceWorker.getRegistration('/'))?.pushManager.getSubscription()
	if (!subscription) return 'ready'
	try {
		const status = await customFetch<{ active: boolean }>(apiRoutes.notifications.subscriptionStatus, {
			method: 'POST',
			body: { endpoint: subscription.endpoint },
		})
		return status.active ? 'enabled' : 'ready'
	} catch {
		return 'ready'
	}
}

const decodeVapidKey = (value: string): Uint8Array => {
	const base64 = `${value}${'='.repeat((4 - (value.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/')
	const raw = window.atob(base64)
	return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

const encodeBase64Url = (value: ArrayBuffer): string => {
	const binary = Array.from(new Uint8Array(value), (byte) => String.fromCharCode(byte)).join('')
	return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
