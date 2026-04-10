import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			globals: true,
			environment: 'jsdom',
			setupFiles: ['./src/test/setup.ts'],
			include: ['src/**/*.test.{ts,tsx}'],
			coverage: {
				provider: 'v8',
				reporter: ['text', 'lcov', 'html'],
				include: ['src/**/*.{ts,tsx}'],
				exclude: [
					'src/test/**',
					'src/**/*.test.{ts,tsx}',
					'src/**/*.d.ts',
					'src/vite-env.d.ts',
					'src/main.tsx',
					'src/models/**',
					'src/i18n/locales/**',
				],
				thresholds: {
					lines: 60,
					branches: 48,
					functions: 53,
					statements: 58,
				},
			},
		},
	})
)
