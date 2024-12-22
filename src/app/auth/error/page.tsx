import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/ui';

export default function AuthErrorPage() {
	return (
		<Card
			className={'duration-300 animate-in fade-in-15 slide-in-from-bottom-3'}>
			<CardHeader>
				<CardTitle className='text-xl'>Something went wrong.</CardTitle>
			</CardHeader>
			<CardContent>
				<Link
					href='/auth'
					className='opacity-75 transition-opacity duration-100 hover:text-black hover:opacity-100'>
					<span>Back to login</span>
				</Link>
			</CardContent>
		</Card>
	);
}
