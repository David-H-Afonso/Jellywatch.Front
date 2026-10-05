self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
	let payload = {}
	if (event.data) {
		try { payload = event.data.json() } catch { payload = { body: event.data.text() } }
	}
	const url = typeof payload.url === 'string' && payload.url.startsWith('/') ? payload.url : '/'
	event.waitUntil(self.registration.showNotification(payload.title || 'Jellywatch', {
		body: payload.body || '',
		icon: '/logo.png',
		badge: '/logo.png',
		tag: payload.tag || `jellywatch-${Date.now()}`,
		data: { url },
	}))
})

self.addEventListener('notificationclick', (event) => {
	event.notification.close()
	const requested = event.notification.data?.url || '/'
	// Jellywatch uses createHashRouter; opening /series/123 without the hash
	// loads the SPA but leaves it on its dashboard instead of the series detail.
	const target = new URL(`/#${requested}`, self.location.origin)
	if (target.origin !== self.location.origin) target.href = new URL('/', self.location.origin).href
	event.waitUntil((async () => {
		const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
		const existing = windows.find((client) => client.url.startsWith(self.location.origin))
		if (existing) { await existing.navigate(target.href); await existing.focus() }
		else await self.clients.openWindow(target.href)
	})())
})
