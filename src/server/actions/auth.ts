'use server';

import { signOut } from '@/auth';

/**
 * Sign out
 * @returns Promise<void>
 */
export const handleSignOut = async () => {
	await signOut();
};
