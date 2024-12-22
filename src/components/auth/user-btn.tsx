'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { cn } from '@/utils';

type UserButtonProps = React.HTMLAttributes<HTMLAnchorElement> & {
	className?: string;
};

export function UserButton({ className }: UserButtonProps) {
	const { data: session } = useSession();

	if (!session?.user || !session.user.image) return null;

	return (
		<Link
			href='/profile'
			className={cn(
				'w-7 h-7 rounded overflow-hidden hover:opacity-80 transition-all duration-300 shadow z-10 border-2 border-forest-200 bg-forest-200',
				className
			)}>
			<img src={session.user.image} referrerPolicy='no-referrer' />
		</Link>
	);
}
