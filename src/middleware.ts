import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';

import AuthConfig from '@/auth.config';
import {
	DEFAULT_AUTH_REDIRECT_URL,
	API_AUTH_PREFIX,
	AUTH_ROUTES,
	PROTECTED_ROUTES,
} from './routes';

const { auth } = NextAuth(AuthConfig);

/**
 * Middleware to handle the routing flow.
 * @param req
 */
export default auth(async (req) => {
	const { nextUrl: NextURL } = req;

	const isLoggedIn = !!req.auth;

	const isApiAuthRoute = NextURL.pathname.startsWith(API_AUTH_PREFIX);
	const isProtectedRoute = PROTECTED_ROUTES.includes(NextURL.pathname);
	const isAuthRoute = AUTH_ROUTES.includes(NextURL.pathname);

	/* Api Route */
	if (isApiAuthRoute) return;

	/* Auth Route */
	if (isAuthRoute) {
		if (isLoggedIn)
			return NextResponse.redirect(
				new URL(DEFAULT_AUTH_REDIRECT_URL, NextURL)
			);
		return;
	}

	/* Protected route */
	if (!isLoggedIn && isProtectedRoute) {
		let callbackURL = NextURL.pathname;
		if (NextURL.search) callbackURL += NextURL.search;
		const encodedCallbackURL = encodeURIComponent(callbackURL);
		return NextResponse.redirect(
			new URL(`/auth?callbackUrl=${encodedCallbackURL}`, NextURL)
		);
	}

	/* Public route */
	return;
});

export const config = {
	matcher: [
		'/((?!api/|_next/|images/|docs/|_proxy/|_static|_vercel|[\\w-]+\\.\\w+).*)',
		'/s/:slug*',
	],
};
