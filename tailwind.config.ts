import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	prefix: '',
	theme: {
		container: {
			center: true,
			padding: '1rem',
			screens: { '2xl': '1400px' },
		},
		extend: {
			colors: {
				forest: {
					100: '#a6bbb9',
					200: '#789B84',
					300: '#5A8470',
					400: '#3D6C5F',
					500: '#205550',
					600: '#1B464B',
					700: '#1a2f2d',
				},
			},
			fontFamily: {
				sans: ['var(--font-atkinson-regular)', ...fontFamily.sans],
				mono: ['var(--font-atkinson-bold)', ...fontFamily.mono],
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'background-shine': {
					from: {
						backgroundPosition: '0 0',
					},
					to: {
						backgroundPosition: '-200% 0',
					},
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'background-shine': 'background-shine 2s linear infinite',
			},
		},
	},
	plugins: [
		require('tailwindcss-animate'),
		require('@tailwindcss/typography'),
		require('tailwind-scrollbar'),
	],
} satisfies Config;

export default config;
