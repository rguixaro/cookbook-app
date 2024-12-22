import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
	/* config options here */
	pageExtensions: ['ts', 'tsx'],
	experimental: {
		optimizePackageImports: ['lucide-react'],
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
			},
		],
	},
};

export default withNextIntl(nextConfig);
