'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Loader } from 'lucide-react'
import { toast } from 'sonner'

import { DEFAULT_AUTH_REDIRECT_URL } from '@/routes'
import { GoogleLogo } from '@/components/icons'

const socialProviders = [
	{
		name: 'google-login',
		icon: <GoogleLogo className='h-4 w-4' />,
		provider: 'google',
	},
]

export const SocialLogin = () => {
	const t = useTranslations('LoginPage')
	const searchParams = useSearchParams()
	const callbackUrl = searchParams.get('callbackUrl')
	const [loading, setLoading] = useState<boolean>(false)
	const [provider, setProvider] = useState<string | null>()

	const handleSocialLogin = async (provider: string) => {
		try {
			setLoading(true)
			setProvider(provider)
			await signIn(provider, {
				callbackUrl: callbackUrl || DEFAULT_AUTH_REDIRECT_URL,
			})
		} catch (error) {
			toast.error(t('login-error'))
		}
	}

	return (
		<div className='flex flex-col items-center justify-center space-y-10 text-forest-200'>
			{socialProviders.map((sp) => (
				<button
					key={sp.provider}
					className='flex p-4 items-center justify-center space-x-5 bg-forest-200/15 hover:bg-forest-200/35 rounded transition-colors duration-300 shadow'
					disabled={loading}
					onClick={() => handleSocialLogin(sp.provider)}>
					{sp.icon}
					<span className='font-semibold'>{t(sp.name)}</span>
				</button>
			))}
			{provider && <Loader className='animate-spin mt-10' size={24} />}
		</div>
	)
}
