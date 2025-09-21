'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { AnimatePresence } from 'motion/react'
import * as motion from 'motion/react-client'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'

import { useDebounce } from '@/hooks'
import { UserButton, SocialButton, SearchButton } from '@/components/layout'
import { Categories as CategoriesType } from '@/types'
import { Button } from '@/ui'
import { cn } from '@/utils'
import { Categories } from './categories'

type SearchState = 'visible' | 'hidden' | 'outlined'

export const SearchRecipes = ({ withAvatar = true }: { withAvatar?: boolean }) => {
	const t = useTranslations('RecipesPage')
	const t_categories = useTranslations('RecipeCategories')

	const searchParams = useSearchParams()
	const pathname = usePathname()
	const router = useRouter()

	const inputRef = useRef<HTMLInputElement>(null)

	const [status, setStatus] = useState<SearchState>('hidden')
	const debouncedStatus = useDebounce(status, 100)

	const [inputValue, setInputValue] = useState(
		searchParams.get('search')?.toString() || ''
	)

	const [category, setCategory] = useState<CategoriesType | null>(
		searchParams.get('category')?.toString() || null
	)

	const tCategory = (category?: string) => {
		if (!category) return ''
		return t_categories(category.toLowerCase())
	}

	/**
	 * Handle the search input
	 * @param e
	 */
	const handleSearch = useDebouncedCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const params = new URLSearchParams(searchParams)
			if (e.target.value) params.set('search', e.target.value)
			else params.delete('search')

			router.replace(`${pathname}?${params.toString()}`)
		},
		300
	)

	/**
	 * Handle the category selection
	 * @param category
	 */
	const handleSelect = useDebouncedCallback((category: string) => {
		const params = new URLSearchParams(searchParams)
		if (category) {
			params.set('category', category)
			setCategory(category)
		} else {
			params.delete('category')
			setCategory(null)
		}
		router.replace(`${pathname}?${params.toString()}`)
	}, 300)

	/**
	 * Handle removing the selected category
	 * @param e Remove the selected category
	 */
	const handleRemoveCategory = (e: React.MouseEvent<HTMLElement>) => {
		e.preventDefault()
		const params = new URLSearchParams(searchParams)
		params.delete('category')
		setCategory(null)
		router.replace(`${pathname}?${params.toString()}`)
	}

	/**
	 * Change the status of the search input
	 */
	const onStatusChange = () => {
		const value = inputRef.current?.value
		if (status === 'hidden') {
			setStatus('visible')
			inputRef.current?.focus()
		} else if (status === 'visible') {
			setStatus(value ? 'outlined' : 'hidden')
		} else if (status === 'outlined') {
			if (!value) setStatus('hidden')
		}
	}

	/**
	 * Handle onBlur event
	 */
	const onBlur = () => {
		const value = inputRef.current?.value
		if (!value) setStatus('hidden')
	}

	/**
	 * If there is a search param, set the status to outlined
	 */
	useEffect(() => {
		if (searchParams.get('search')) {
			setStatus('outlined')
		}
	}, [searchParams])

	return (
		<div className='w-full flex flex-col my-2'>
			<div className='w-full flex items-end justify-between mb-2'>
				<div
					className={cn(
						'h-8 flex duration-1000 transition-transform relative',
						debouncedStatus !== 'hidden'
							? 'translate-x-[2px]'
							: 'translate-x-0'
					)}>
					<input
						type='text'
						ref={inputRef}
						placeholder={t('search')}
						onBlur={onBlur}
						value={inputValue}
						onChange={(e) => {
							setInputValue(e.target.value)
							handleSearch(e)
						}}
						className={cn(
							'relative block w-0 h-8 text-sm z-10 bg-forest-200/15 text-forest-200 font-medium placeholder-forest-200/75',
							'transition-all duration-500 border-l-[5px] border-forest-200 rounded-[5px] focus:outline-none ring-1 ring-forest-200 ps-9 pe-3',
							debouncedStatus === 'hidden'
								? 'opacity-0 pointer-events-none'
								: 'w-full pointer-events-auto'
						)}
						required
					/>
					<SearchButton
						onClick={onStatusChange}
						className={cn(
							'absolute top-1/2 -translate-y-1/2 transition-transform',
							debouncedStatus !== 'hidden'
								? 'translate-x-1 bg-forest-200/15'
								: 'translate-x-0'
						)}
						iconClassName={cn(
							debouncedStatus === 'visible' && 'rotate-90',
							debouncedStatus === 'hidden'
								? 'text-forest-200'
								: 'text-forest-300'
						)}
					/>
					<button
						type='button'
						onClick={() => {
							setInputValue('')
							if (inputRef.current) {
								inputRef.current.value = ''
								handleSearch({
									target: inputRef.current,
								} as React.ChangeEvent<HTMLInputElement>)
							}
							onStatusChange()
						}}
						className={cn(
							'absolute top-1/2 right-0 -translate-y-1/2 z-30 text-forest-300 transition-all duration-200 ease-in-out',
							inputValue
								? 'opacity-100 -translate-x-2'
								: 'opacity-0 translate-x-2 pointer-events-none'
						)}>
						<X className='w-4 h-4' />
					</button>
				</div>
				{withAvatar && (
					<div className='flex flex-row'>
						<SocialButton />
						<UserButton />
					</div>
				)}
			</div>
			<div className='flex flex-col ms-[2px]'>
				<div className='flex space-x-2'>
					<Categories
						onSelect={handleSelect}
						selected={category}
						trigger={
							<Button size={'sm'}>
								<span className='text-base md:text-lg font-bold'>
									{t('categories')}
								</span>
							</Button>
						}
					/>
					<AnimatePresence>
						{category && (
							<motion.div
								key='selected-category'
								initial={{ opacity: 0, x: -25 }}
								animate={{
									opacity: 1,
									x: 0,
									transition: { duration: 0.3 },
								}}
								exit={{
									opacity: 0,
									x: -25,
									transition: { duration: 0.3 },
								}}
								className='bg-forest-200/75 rounded text-white flex items-center'>
								<button
									onClick={handleRemoveCategory}
									className='flex items-center justify-center px-3 space-x-2'>
									<span className='font-semibold text-sm md:text-base'>
										{tCategory(category)}
									</span>
									<X size={14} className='mt-0.5' />
								</button>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	)
}
