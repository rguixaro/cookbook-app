import Link from 'next/link';

import { TypographyH1 } from '@/ui';

export const Header = () => {
	return (
		<Link
			href='/'
			className='flex h-24 bg-[#fefff2] justify-center items-center sticky top-0 cursor-pointer border-b-4 border-forest-200 z-50'>
			<div className='w-full text-center'>
				<TypographyH1 className='font-title text-forest-200 pb-5'>
					{'CookBook'}
				</TypographyH1>
			</div>
		</Link>
	);
};
