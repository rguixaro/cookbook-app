import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
	test: {
		environment: 'node',
		exclude: ['e2e/**', 'node_modules/**'],
		setupFiles: ['./src/test/setup.ts'],
		testTimeout: 10000,
		typecheck: {
			tsconfig: './tsconfig.test.json',
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: './coverage',
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				'src/**/*.test.{ts,tsx}',
				'src/**/*.d.ts',
				'src/types/**',
				'src/env.ts',
				'src/app/**/layout.tsx',
				'src/app/**/page.tsx',
				'src/app/**/template.tsx',
			],
			thresholds: {
				statements: 20,
				branches: 20,
				functions: 12,
				lines: 20,
			},
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
})
