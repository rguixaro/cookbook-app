import type { UserRole } from '@prisma/client';
import { type DefaultSession } from 'next-auth';

export type ExtendedUser = DefaultSession['user'] & {
	role: UserRole;
	isOAuth: boolean;
	savedRecipes: string[];
};

declare module 'next-auth' {
	interface Session {
		user: ExtendedUser;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		user?: {
			username: string | undefined;
		} & DefaultSession['user'];
	}
}
