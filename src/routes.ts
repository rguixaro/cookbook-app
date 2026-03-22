/**
 * Routes used for authentication.
 * Auth not required.
 */
export const AUTH_ROUTES: string[] = ['/auth', '/auth/error']

/**
 * Routes that require authentication.
 * Auth required.
 */
export const PROTECTED_ROUTES: string[] = [
	'/',
	'/profile',
	'/profiles',
	'/recipes',
	'/recipes/new',
]

/**
 * Recipes routes prefix.
 * Auth required.
 */
export const RECIPES_ROUTE_PREFIX: string = '/recipes/'

/**
 * Profiles routes prefix.
 * Auth required.
 */
export const PROFILES_ROUTE_PREFIX: string = '/profiles/'

/**
 * API Authentication routes prefix.
 * Auth not required.
 */
export const API_AUTH_PREFIX: string = '/api/auth'

/**
 * Default redirect URL.
 * Auth not required.
 */
export const DEFAULT_AUTH_REDIRECT_URL: string = '/'
