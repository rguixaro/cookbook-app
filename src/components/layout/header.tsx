'use client';

import { useAuthStore } from '@/providers/auth-store-provider';

import { TypographyH1 } from '@/ui/typography';

const Header = () => {
	const { isAuthenticated } = useAuthStore((state) => state);

	return (
		<a
			href='/'
			className='flex h-24 bg-[#fefff2] justify-center items-center sticky top-0 cursor-pointer border-b-4 border-forest-200'>
			<div className='w-full text-center'>
				<TypographyH1 className='font-title text-forest-200 pb-5'>
					{'CookBook'}
				</TypographyH1>
			</div>
		</a>
	);
};

export default Header;
