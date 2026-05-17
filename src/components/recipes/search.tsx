'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { AnimatePresence } from 'motion/react'
import * as motion from 'motion/react-client'
import { useTranslations } from 'next-intl'
import { ListFilter, X } from 'lucide-react'

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
const SEARCH_DEBOUNCE_MS = 450
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
	searchParamName = 'search',
	showListFilter = true,
}: {
	withAvatar?: boolean
	listFilter?: ListFilter
	searchParamName?: string
	showListFilter?: boolean
}) => {
	const t = useTranslations('RecipesPage')
	const t_courses = useTranslations('RecipeCourses')
	const t_categories = useTranslations('RecipeCategories')

	const searchParams = useSearchParams()
	const pathname = usePathname()
	const router = useRouter()

	const inputRef = useRef<HTMLInputElement>(null)

	const [status, setStatus] = useState<SearchState>('hidden')
	const isSearchOpen = status !== 'hidden'

	const searchValue = searchParams.get(searchParamName)?.toString() || ''
	const courseValue =
		(searchParams.get('course')?.toString() as RecipeCourse) || null
	const categoriesValue = searchParams.get('categories')?.toString() || ''
	const sortValue = parseSort(searchParams.get('sort'))
	const isListFilteredValue = searchParams.get(listFilter) === 'true'
	const [inputValue, setInputValue] = useState(searchValue)
	const inputValueRef = useRef(searchValue)

	const [course, setCourse] = useState<RecipeCourse | null>(courseValue)
	const [categories, setCategories] = useState<string[]>(
		categoriesValue
			.split(',')
			.map((category) => category.trim())
			.filter(Boolean),
	)
	const [sort, setSort] = useState<RecipeSort>(sortValue)

	const [isListFiltered, setIsListFiltered] = useState(isListFilteredValue)

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

	const getSearchHref = (params: URLSearchParams) => {
		const query = params.toString()
		return query ? `${pathname}?${query}` : pathname
	}

	const setSearchParam = (params: URLSearchParams, value: string) => {
		const nextSearch = value.trim()
		if (nextSearch) params.set(searchParamName, nextSearch)
		else params.delete(searchParamName)
	}

	const replaceSearch = (value: string) => {
		const params = new URLSearchParams(searchParams)
		setSearchParam(params, value)

		router.replace(getSearchHref(params), { scroll: false })
	}

	const handleSearch = useDebouncedCallback(
		(value: string) => replaceSearch(value),
		SEARCH_DEBOUNCE_MS,
	)

	const getParamsWithDraftSearch = () => {
		handleSearch.cancel()
		const params = new URLSearchParams(searchParams)
		setSearchParam(
			params,
			inputRef.current?.value ?? inputValueRef.current,
		)
		return params
	}

	const commitSearch = (value: string) => {
		handleSearch.cancel()
		replaceSearch(value)
	}

	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== 'Enter') return
		e.preventDefault()
		commitSearch(e.currentTarget.value)
	}

	const handleApplyFilters = ({ sort, course, categories }: FilterValues) => {
		const params = getParamsWithDraftSearch()

		if (sort === DEFAULT_SORT) params.delete('sort')
		else params.set('sort', sort)

		if (course) params.set('course', course)
		else params.delete('course')

		if (categories.length) params.set('categories', categories.join(','))
		else params.delete('categories')

		setSort(sort)
		setCourse(course as RecipeCourse | null)
		setCategories(categories)
		router.replace(getSearchHref(params))
	}

	/**
	 * Handle toggling favourites filter
	 */
	const handleToggleListFilter = () => {
		const params = getParamsWithDraftSearch()
		const next = !isListFiltered
		if (next) params.set(listFilter, 'true')
		else params.delete(listFilter)
		setIsListFiltered(next)
		router.replace(getSearchHref(params))
	}

	/**
	 * Handle removing the selected course
	 * @param e Remove the selected course
	 */
	const handleRemoveCourse = (e: React.MouseEvent<HTMLElement>) => {
		e.preventDefault()
		const params = getParamsWithDraftSearch()
		params.delete('course')
		setCourse(null)
		router.replace(getSearchHref(params))
	}

	const handleRemoveSort = () => {
		const params = getParamsWithDraftSearch()
		params.delete('sort')
		setSort(DEFAULT_SORT)
		router.replace(getSearchHref(params))
	}

	const handleRemoveCategory = (category: string) => {
		const nextCategories = categories.filter((value) => value !== category)
		const params = getParamsWithDraftSearch()
		if (nextCategories.length) {
			params.set('categories', nextCategories.join(','))
		} else {
			params.delete('categories')
		}
		setCategories(nextCategories)
		router.replace(getSearchHref(params))
	}

	/**
	 * Change the status of the search input
	 */
	const onStatusChange = () => {
		if (status === 'hidden') {
			setStatus('visible')
			inputRef.current?.focus()
			return
		}

		setStatus('hidden')
	}

	/**
	 * Handle onBlur event
	 */
	const onBlur = () => {
		const value = inputRef.current?.value ?? inputValueRef.current
		if (handleSearch.isPending()) commitSearch(value)
		if (value.trim()) setStatus('outlined')
		else setStatus('hidden')
	}

	useEffect(() => {
		if (inputRef.current && document.activeElement === inputRef.current) {
			return
		}

		inputValueRef.current = searchValue
		setInputValue(searchValue)
		if (searchValue) {
			setStatus('outlined')
			return
		}

		setStatus((current) => (current === 'outlined' ? 'hidden' : current))
	}, [searchValue])

	useEffect(() => {
		setCourse(courseValue)
		setCategories(
			categoriesValue
				.split(',')
				.map((category) => category.trim())
				.filter(Boolean),
		)
		setSort(sortValue)
		setIsListFiltered(isListFilteredValue)
	}, [categoriesValue, courseValue, isListFilteredValue, sortValue])

	return (
		<div className='w-11/12 sm:w-3/5 lg:w-3/8 flex flex-col my-5'>
			<div className='w-full flex items-center gap-3 mb-4'>
				<SearchInput
					placeholder={t('search')}
					value={inputValue}
					inputRef={inputRef}
					onBlur={onBlur}
					onKeyDown={handleSearchKeyDown}
					onSearchButtonClick={onStatusChange}
					onChange={(e) => {
						const value = e.target.value
						inputValueRef.current = value
						setInputValue(value)
						handleSearch(value)
					}}
					onClear={() => {
						inputValueRef.current = ''
						setInputValue('')
						commitSearch('')
						onStatusChange()
					}}
					wrapperClassName={cn(
						'flex-none transition-[width,max-width] duration-500 ease-in-out',
						isSearchOpen
							? 'w-[calc(100%-7rem)] max-w-[calc(100%-7rem)] sm:w-72 md:w-80 sm:max-w-72 md:max-w-80'
							: 'w-14',
					)}
					inputClassName={cn(
						'transition-all duration-500',
						isSearchOpen
							? 'w-full opacity-100 pointer-events-auto'
							: 'w-0 opacity-0 pointer-events-none',
					)}
					searchButtonClassName={cn(isSearchOpen && 'bg-forest-150')}
					searchIconClassName={cn(
						status === 'visible' && 'rotate-90',
						isSearchOpen ? 'text-forest-300' : 'text-forest-200',
					)}
					clearButtonClassName={cn(
						!isSearchOpen &&
							'opacity-0 translate-x-2 pointer-events-none',
					)}
				/>
				{withAvatar && (
					<div className='ml-auto flex shrink-0 bg-forest-100 p-1 px-3 rounded-xl space-x-3'>
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
				{showListFilter && (
					<Button size={'sm'} onClick={handleToggleListFilter}>
						{listFilter === 'saved' ? (
							<BookmarkIcon
								filled={isListFiltered}
								size={16}
								color='#fefff2'
							/>
						) : (
							<HeartIcon filled={isListFiltered} size={16} />
						)}
						<span className={cn('text-base font-bold text-forest-50')}>
							{t(listFilter)}
						</span>
					</Button>
				)}
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
								className='bg-forest-200/75 rounded-xl text-forest-50 flex items-center'>
								<button
									onClick={handleRemoveSort}
									className='flex items-center justify-center gap-2 px-3 py-1'>
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
								className='bg-forest-200/75 rounded-xl text-forest-50 flex items-center'>
								<button
									onClick={handleRemoveCourse}
									className='flex items-center justify-center gap-2 px-3 py-1'>
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
								className='bg-forest-150 rounded-xl text-forest-200 flex items-center'>
								<button
									onClick={() => handleRemoveCategory(category)}
									className='flex items-center justify-center gap-2 px-3 py-1'>
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
