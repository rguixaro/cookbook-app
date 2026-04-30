'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { AnimatePresence } from 'motion/react'
import * as motion from 'motion/react-client'
import { useTranslations } from 'next-intl'
import { ArrowDown, ArrowUp, ListFilter, X } from 'lucide-react'

import { useDebounce } from '@/hooks'
import { UserButton, SocialButton } from '@/components/layout'
import { type RecipeCourse, type RecipeSort } from '@/types'
import { Button, SearchInput } from '@/ui'
import { BookmarkIcon, HeartIcon } from '@/components/icons'
import { cn } from '@/utils'
import { Filters } from './filters'

type SearchState = 'visible' | 'hidden' | 'outlined'
type ListFilter = 'favourites' | 'saved'
type FilterValues = {
	sort: RecipeSort
	course: string | null
	categories: string[]
}

const DEFAULT_SORT: RecipeSort = 'createdAtDesc'
const parseSort = (value: string | null): RecipeSort =>
	value === 'createdAtAsc' ||
	value === 'createdAtDesc' ||
	value === 'timeAsc' ||
	value === 'timeDesc'
		? value
		: DEFAULT_SORT

export const SearchRecipes = ({
	withAvatar = true,
	listFilter = 'favourites',
}: {
	withAvatar?: boolean
	listFilter?: ListFilter
}) => {
	const t = useTranslations('RecipesPage')
	const t_courses = useTranslations('RecipeCourses')
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

	const [course, setCourse] = useState<RecipeCourse | null>(
		(searchParams.get('course')?.toString() as RecipeCourse) || null,
	)
	const [categories, setCategories] = useState<string[]>(
		searchParams
			.get('categories')
			?.split(',')
			.map((category) => category.trim())
			.filter(Boolean) ?? [],
	)
	const [sort, setSort] = useState<RecipeSort>(
		parseSort(searchParams.get('sort')),
	)

	const [isListFiltered, setIsListFiltered] = useState(
		searchParams.get(listFilter) === 'true',
	)

	const tCourse = (course?: string) => {
		if (!course) return ''
		return t_courses(course.toLowerCase())
	}

	const tCategory = (category?: string) => {
		if (!category) return ''
		return t_categories(category.toLowerCase())
	}

	const tSort = (sort: RecipeSort) => {
		if (sort.startsWith('time')) {
			return sort.endsWith('Asc') ? t('sort-quickest') : t('sort-longest')
		}

		return sort.endsWith('Asc') ? t('sort-oldest') : t('sort-newest')
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

	const handleApplyFilters = ({ sort, course, categories }: FilterValues) => {
		const params = new URLSearchParams(searchParams)

		if (sort === DEFAULT_SORT) params.delete('sort')
		else params.set('sort', sort)

		if (course) params.set('course', course)
		else params.delete('course')

		if (categories.length) params.set('categories', categories.join(','))
		else params.delete('categories')

		setSort(sort)
		setCourse(course as RecipeCourse | null)
		setCategories(categories)
		router.replace(`${pathname}?${params.toString()}`)
	}

	/**
	 * Handle toggling favourites filter
	 */
	const handleToggleListFilter = () => {
		const params = new URLSearchParams(searchParams)
		const next = !isListFiltered
		if (next) params.set(listFilter, 'true')
		else params.delete(listFilter)
		setIsListFiltered(next)
		router.replace(`${pathname}?${params.toString()}`)
	}

	/**
	 * Handle removing the selected course
	 * @param e Remove the selected course
	 */
	const handleRemoveCourse = (e: React.MouseEvent<HTMLElement>) => {
		e.preventDefault()
		const params = new URLSearchParams(searchParams)
		params.delete('course')
		setCourse(null)
		router.replace(`${pathname}?${params.toString()}`)
	}

	const handleRemoveSort = () => {
		const params = new URLSearchParams(searchParams)
		params.delete('sort')
		setSort(DEFAULT_SORT)
		router.replace(`${pathname}?${params.toString()}`)
	}

	const handleRemoveCategory = (category: string) => {
		const nextCategories = categories.filter((value) => value !== category)
		const params = new URLSearchParams(searchParams)
		if (nextCategories.length) {
			params.set('categories', nextCategories.join(','))
		} else {
			params.delete('categories')
		}
		setCategories(nextCategories)
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
						debouncedStatus !== 'hidden' ? 'translate-x-0.5' : 'translate-x-0',
					)}
					inputClassName={cn(
						'w-0',
						debouncedStatus === 'hidden'
							? 'opacity-0 pointer-events-none'
							: 'w-full pointer-events-auto',
					)}
					searchButtonClassName={cn(
						'bg-forest-100',
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
					<div className='flex bg-forest-100 p-1 px-3 rounded-xl space-x-3'>
						<SocialButton />
						<UserButton />
					</div>
				)}
			</div>
			<div className='flex flex-wrap gap-2 ms-0.5'>
				<Filters
					selectedSort={sort}
					selectedCourse={course}
					selectedCategories={categories}
					onApply={handleApplyFilters}
					trigger={
						<Button size={'sm'}>
							<ListFilter size={16} className='stroke-forest-50' />
							<span className='text-base font-bold text-forest-50'>
								{t('filters')}
							</span>
						</Button>
					}
				/>
				<div className='grow' />
				<Button size={'sm'} onClick={handleToggleListFilter}>
					{listFilter === 'saved' ? (
						<BookmarkIcon filled={isListFiltered} size={16} color='#fefff2' />
					) : (
						<HeartIcon filled={isListFiltered} size={16} />
					)}
					<span className={cn('text-base font-bold text-forest-50')}>
						{t(listFilter)}
					</span>
				</Button>
			</div>
			{(sort !== DEFAULT_SORT || course || categories.length > 0) && (
				<div className='mt-2 flex flex-wrap gap-2 ms-0.5'>
					<AnimatePresence>
						{sort !== DEFAULT_SORT && (
							<motion.div
								key='selected-sort'
								initial={{ opacity: 0, y: -8 }}
								animate={{
									opacity: 1,
									y: 0,
									transition: { duration: 0.2 },
								}}
								exit={{
									opacity: 0,
									y: -8,
									transition: { duration: 0.2 },
								}}
								className='bg-forest-200/75 rounded-xl text-forest-50 flex items-center'
							>
								<button
									onClick={handleRemoveSort}
									className='flex items-center justify-center gap-2 px-3 py-1'
								>
									<span className='font-semibold text-sm md:text-base'>
										{tSort(sort)}
									</span>
									<X size={14} className='mt-0.5' />
								</button>
							</motion.div>
						)}
						{course && (
							<motion.div
								key='selected-course'
								initial={{ opacity: 0, y: -8 }}
								animate={{
									opacity: 1,
									y: 0,
									transition: { duration: 0.2 },
								}}
								exit={{
									opacity: 0,
									y: -8,
									transition: { duration: 0.2 },
								}}
								className='bg-forest-200/75 rounded-xl text-forest-50 flex items-center'
							>
								<button
									onClick={handleRemoveCourse}
									className='flex items-center justify-center gap-2 px-3 py-1'
								>
									<span className='font-semibold text-sm md:text-base'>
										{tCourse(course)}
									</span>
									<X size={14} className='mt-0.5' />
								</button>
							</motion.div>
						)}
						{categories.map((category) => (
							<motion.div
								key={`selected-category-${category}`}
								initial={{ opacity: 0, y: -8 }}
								animate={{
									opacity: 1,
									y: 0,
									transition: { duration: 0.2 },
								}}
								exit={{
									opacity: 0,
									y: -8,
									transition: { duration: 0.2 },
								}}
								className='bg-forest-150 rounded-xl text-forest-200 flex items-center'
							>
								<button
									onClick={() => handleRemoveCategory(category)}
									className='flex items-center justify-center gap-2 px-3 py-1'
								>
									<span className='font-semibold text-sm md:text-base'>
										{tCategory(category)}
									</span>
									<X size={14} className='mt-0.5' />
								</button>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}
		</div>
	)
}
