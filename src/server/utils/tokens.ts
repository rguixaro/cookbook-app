import { db } from '@/server/db';
import { Token } from '@/types';

/**
 * Get a verification token by token
 * @param token
 * @returns Promise<Token | null>
 */
export const getVerificationTokenByToken = async (
	token: string
): Promise<Token | null> => {
	try {
		return await db.verificationToken.findUnique({ where: { token } });
	} catch (error) {
		return null;
	}
};

/**
 * Get a verification token by email
 * @param email
 * @returns Promise<Token | null>
 */
export const getVerificationTokenByEmail = async (
	email: string
): Promise<Token | null> => {
	try {
		return await db.verificationToken.findFirst({ where: { email } });
	} catch (error) {
		return null;
	}
};

/**
 * Get a password reset token by token
 * @param token
 * @returns Promise<Token | null>
 */
export const getPasswordResetTokenByToken = async (
	token: string
): Promise<Token | null> => {
	try {
		return await db.passwordResetToken.findFirst({ where: { token } });
	} catch (error) {
		return null;
	}
};

/**
 * Get a password reset token by email
 * @param email
 * @returns Promise<Token | null>
 */
export const getPasswordResetTokenByEmail = async (
	email: string
): Promise<Token | null> => {
	try {
		return await db.passwordResetToken.findFirst({ where: { email } });
	} catch (error) {
		return null;
	}
};
