import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
	test: {
		environment: 'node',
		exclude: ['tests/**', 'node_modules/**'],
		typecheck: {
			tsconfig: './tsconfig.test.json',
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
})
