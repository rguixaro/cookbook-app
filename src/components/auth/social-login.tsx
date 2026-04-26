'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Loader } from 'lucide-react'
import { toast } from 'sonner'

import { DEFAULT_AUTH_REDIRECT_URL } from '@/routes'
import { GoogleLogo } from '@/components/icons'
import { Button } from '@/ui'

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
	const rawCallbackUrl = searchParams.get('callbackUrl')
	const callbackUrl = (() => {
		if (!rawCallbackUrl) return null
		if (
			rawCallbackUrl.startsWith('/') &&
			rawCallbackUrl[1] !== '/' &&
			rawCallbackUrl[1] !== '\\'
		) {
			return rawCallbackUrl
		}
		return null
	})()
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
		<div className='flex flex-col items-center justify-center space-y-10 text-forest-100 w-full'>
			{socialProviders.map((sp) => (
				<div key={sp.provider} className='w-full rounded-xl'>
					<Button
						className='h-auto w-full space-x-5 rounded-xl p-4 text-base text-forest-100 shadow-none!'
						disabled={loading}
						onClick={() => handleSocialLogin(sp.provider)}>
						{sp.icon}
						<span className='font-semibold'>{t(sp.name)}</span>
					</Button>
				</div>
			))}
			{provider && <Loader className='animate-spin mt-10' size={24} />}
		</div>
	)
}
