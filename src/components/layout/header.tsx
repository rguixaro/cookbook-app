'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useProfileContext } from '@/providers'
import { TypographyH1 } from '@/ui'

export const Header = () => {
	const pathname = usePathname()
	const { currentUserName, profileName } = useProfileContext()
	const nameToDisplay = profileName || currentUserName

	if (pathname?.startsWith('/auth')) return null

	let displayName = ''
	if (nameToDisplay) {
		displayName = nameToDisplay.split(' ')[0]
		if (displayName.length > 12) {
			displayName = displayName.slice(0, 10) + '...'
		}
	}

	return (
		<Link
			href='/'
			className='flex h-20 w-full justify-center items-center sticky top-4 cursor-pointer z-50'>
			<div className='text-center h-full rounded-2xl w-11/12 sm:w-3/5 lg:w-3/8 bg-forest-200 shadow-center items-center justify-center flex'>
				<TypographyH1 className='mt-0 font-title text-forest-50'>
					{displayName ? (
						<span className='text-3xl sm:text-4xl text-forest-100'>{`${displayName}'s `}</span>
					) : null}
					{'CookBook'}
				</TypographyH1>
			</div>
		</Link>
	)
}
