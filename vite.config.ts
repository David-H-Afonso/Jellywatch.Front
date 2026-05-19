import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'
import react from '@vitejs/plugin-react'

const apiProxyTarget =
	process.env.VITE_PROXY_API_URL || process.env.VITE_API_URL || 'http://localhost:5011'

const apiProxy = {
	target: apiProxyTarget,
	changeOrigin: true,
	secure: false,
}

export default defineConfig({
	plugins: [
		react(),
		svgr({
			svgrOptions: {
				exportType: 'default',
			},
			include: '**/*.svg?react',
		}),
	],
	base: './',
	resolve: {
		alias: {
			'@': '/src',
			'@/assets': '/src/assets',
			'@/components': '/src/components',
			'@/hooks': '/src/hooks',
			'@/services': '/src/services',
			'@/utils': '/src/utils',
			'@/models': '/src/models',
			'@/store': '/src/store',
			'@/environments': '/src/environments',
			'@/layouts': '/src/layouts',
			'@/navigation': '/src/navigation',
		},
	},
	build: {
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: false,
		rollupOptions: {
			output: {
				manualChunks: undefined,
			},
		},
	},
	server: {
		port: 5173,
		host: true,
		proxy: {
			'/api': apiProxy,
		},
	},
	preview: {
		proxy: {
			'/api': apiProxy,
		},
	},
})
