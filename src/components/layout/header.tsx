'use client'

import Link from 'next/link'

import { TypographyH1 } from '@/ui'
import { useProfileContext } from '@/providers'

export const Header = () => {
	const { currentUserName, profileName } = useProfileContext()
	const nameToDisplay = profileName || currentUserName

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
			className='flex h-24 w-full justify-center items-center sticky top-0 cursor-pointer rounded-b-2xl z-50'>
			<div className='text-center h-full rounded-b-2xl border-b-4 border-forest-200 w-11/12 sm:w-3/5 lg:w-3/8 bg-forest-50'>
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
