'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { AnimatePresence } from 'motion/react'
import * as motion from 'motion/react-client'
import { useTranslations } from 'next-intl'
import { ListFilter, X } from 'lucide-react'

import { useDebounce } from '@/hooks'
import { UserButton, SocialButton } from '@/components/layout'
import { Categories as CategoriesType } from '@/types'
import { Button, SearchInput } from '@/ui'
import { HeartIcon } from '@/components/icons'
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
		searchParams.get('search')?.toString() || '',
	)

	const [category, setCategory] = useState<CategoriesType | null>(
		searchParams.get('category')?.toString() || null,
	)

	const [isFavourites, setIsFavourites] = useState(
		searchParams.get('favourites') === 'true',
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
		300,
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
	 * Handle toggling favourites filter
	 */
	const handleToggleFavourites = () => {
		const params = new URLSearchParams(searchParams)
		const next = !isFavourites
		if (next) params.set('favourites', 'true')
		else params.delete('favourites')
		setIsFavourites(next)
		router.replace(`${pathname}?${params.toString()}`)
	}

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
		<div className='w-11/12 sm:w-3/5 lg:w-3/8 flex flex-col my-4'>
			<div className='w-full flex items-end justify-between mb-4'>
				<SearchInput
					placeholder={t('search')}
					value={inputValue}
					inputRef={inputRef}
					onBlur={onBlur}
					onSearchButtonClick={onStatusChange}
					onChange={(e) => {
						setInputValue(e.target.value)
						handleSearch(e)
					}}
					onClear={() => {
						setInputValue('')
						if (inputRef.current) {
							inputRef.current.value = ''
							handleSearch({
								target: inputRef.current,
							} as React.ChangeEvent<HTMLInputElement>)
						}
						onStatusChange()
					}}
					wrapperClassName={cn(
						'duration-1000 transition-transform',
						debouncedStatus !== 'hidden'
							? 'translate-x-0.5'
							: 'translate-x-0',
					)}
					inputClassName={cn(
						'w-0',
						debouncedStatus === 'hidden'
							? 'opacity-0 pointer-events-none'
							: 'w-full pointer-events-auto',
					)}
					searchButtonClassName={cn(
						debouncedStatus !== 'hidden'
							? 'translate-x-1 bg-forest-150 border-l-4 border-forest-200'
							: 'translate-x-0',
					)}
					searchIconClassName={cn(
						debouncedStatus === 'visible' && 'rotate-90',
						debouncedStatus === 'hidden'
							? 'text-forest-200'
							: 'text-forest-300',
					)}
				/>
				{withAvatar && (
					<div className='flex flex-row'>
						<SocialButton />
						<UserButton />
					</div>
				)}
			</div>
			<div className='flex flex-wrap gap-2 ms-0.5'>
				<Categories
					onSelect={handleSelect}
					selected={category}
					trigger={
						<Button size={'sm'}>
							<ListFilter size={16} className='stroke-forest-50' />
							<span className='text-base font-bold text-forest-50'>
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
							className='bg-forest-200/75 rounded-xl text-forest-50 flex items-center'>
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
				<div className='grow' />
				<Button size={'sm'} onClick={handleToggleFavourites}>
					<HeartIcon filled={isFavourites} size={16} />
					<span className={cn('text-base font-bold text-forest-50')}>
						{t('favourites')}
					</span>
				</Button>
			</div>
		</div>
	)
}
