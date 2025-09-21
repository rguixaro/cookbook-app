'use client'

import Link from 'next/link'

import { TypographyH1 } from '@/ui'
import { useProfileContext } from '@/providers'

export const Header = () => {
	const { currentUserName, authorName } = useProfileContext()
	const nameToDisplay = authorName || currentUserName

	let displayName = ''
	if (nameToDisplay) {
		displayName = nameToDisplay.split(' ')[0]
		if (displayName.length > 12) {
			displayName = displayName.slice(0, 12) + '…'
		}
	}

	return (
		<Link
			href='/'
			className='flex h-24 w-full bg-[#fefff2] justify-center items-center sticky top-0 cursor-pointer border-b-4 border-forest-300 z-50'>
			<div className='w-full text-center'>
				<TypographyH1 className='font-title text-forest-300 pb-5'>
					{displayName ? (
						<span className='text-4xl text-forest-200'>{`${displayName}'s `}</span>
					) : null}
					{'CookBook'}
				</TypographyH1>
			</div>
		</Link>
	)
}
