'use server';

import { revalidatePath } from 'next/cache';
import type { z } from 'zod';

import { auth, signOut } from '@/auth';
import { db } from '@/server/db';
import type { UpdateProfileSchema } from '@/server/schemas';

/**
 * Update Profile.
 * Auth required.
 * @param values {z.infer<typeof UpdateProfileSchema>}
 * @returns Promise<void | null>
 */
export const updateProfile = async (
	values: z.infer<typeof UpdateProfileSchema>
): Promise<void | null> => {
	const currentUser = await auth();

	/** Not authenticated */
	if (!currentUser) return null;

	await db.user.update({
		where: { id: currentUser.user.id },
		data: { ...values },
	});

	revalidatePath('/');
	revalidatePath('/profile');

	return;
};

/**
 * Delete Profile.
 * Auth required.
 * @returns Promise<null | true>
 */
export const deleteProfile = async (): Promise<null | true> => {
	const currentUser = await auth();

	/** Not authenticated */
	if (!currentUser) return null;

	await db.user.delete({ where: { id: currentUser.user.id } });
	await signOut();

	return true;
};
