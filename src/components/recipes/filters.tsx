'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
	useRef,
	useState,
	type CSSProperties,
	type PointerEvent,
	type ReactNode,
} from 'react'
import { X, ArrowUp } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
	RecipeCourses,
	RecipeCategories,
	type RecipeSort,
} from '@/server/schemas'
import { Button } from '@/ui'
import { cn } from '@/utils'
import { Icon } from './icon'

type SortField = 'createdAt' | 'time'
type SortDirection = 'asc' | 'desc'

const DEFAULT_SORT: RecipeSort = 'createdAtDesc'
const CLOSE_DRAG_DISTANCE = 90

function getSortField(sort: RecipeSort): SortField {
	return sort.startsWith('time') ? 'time' : 'createdAt'
}

function getSortDirection(sort: RecipeSort): SortDirection {
	return sort.endsWith('Asc') ? 'asc' : 'desc'
}

function getDefaultSortDirection(field: SortField): SortDirection {
	return field === 'time' ? 'asc' : 'desc'
}

function getSortDirectionForField(
	field: SortField,
	sort: RecipeSort,
): SortDirection {
	return getSortField(sort) === field
		? getSortDirection(sort)
		: getDefaultSortDirection(field)
}

function makeSort(field: SortField, direction: SortDirection): RecipeSort {
	if (field === 'createdAt') {
		return direction === 'asc' ? 'createdAtAsc' : 'createdAtDesc'
	}
	return direction === 'asc' ? 'timeAsc' : 'timeDesc'
}

function toggleSortDirection(direction: SortDirection): SortDirection {
	return direction === 'asc' ? 'desc' : 'asc'
}

interface FiltersProps {
	trigger: ReactNode
	selectedSort: RecipeSort
	selectedCourse: string | null
	selectedCategories: string[]
	onApply: (filters: {
		sort: RecipeSort
		course: string | null
		categories: string[]
	}) => void
	maxCategories?: number
}

export const Filters = ({
	trigger,
	selectedSort,
	selectedCourse,
	selectedCategories,
	onApply,
	maxCategories = 3,
}: FiltersProps) => {
	const t = useTranslations('RecipesPage')
	const t_courses = useTranslations('RecipeCourses')
	const t_categories = useTranslations('RecipeCategories')

	const [isOpen, setIsOpen] = useState(false)
	const [draftSort, setDraftSort] = useState<RecipeSort>(selectedSort)
	const [draftCourse, setDraftCourse] = useState<string | null>(selectedCourse)
	const [draftCategories, setDraftCategories] =
		useState<string[]>(selectedCategories)
	const [dragOffset, setDragOffset] = useState(0)
	const dragStartYRef = useRef<number | null>(null)
	const lastDragOffsetRef = useRef(0)
	const suppressClickRef = useRef(false)

	function selectCourse(course: string) {
		setDraftCourse(draftCourse === course ? null : course)
	}

	function toggleCategory(category: string) {
		const next = draftCategories.includes(category)
			? draftCategories.filter((value) => value !== category)
			: draftCategories.length < maxCategories
				? [...draftCategories, category]
				: draftCategories
		setDraftCategories(next)
	}

	function selectSortField(field: SortField) {
		const currentField = getSortField(draftSort)
		const currentDirection = getSortDirection(draftSort)
		const nextDirection =
			currentField === field
				? toggleSortDirection(currentDirection)
				: getDefaultSortDirection(field)

		setDraftSort(makeSort(field, nextDirection))
	}

	function setOpen(open: boolean) {
		setIsOpen(open)
		setDragOffset(0)
		dragStartYRef.current = null
		lastDragOffsetRef.current = 0

		if (open) {
			setDraftSort(selectedSort)
			setDraftCourse(selectedCourse)
			setDraftCategories(selectedCategories)
		}
	}

	function handleApply() {
		onApply({
			sort: draftSort,
			course: draftCourse,
			categories: draftCategories,
		})
		setOpen(false)
	}

	function handleReset() {
		setDraftSort(DEFAULT_SORT)
		setDraftCourse(null)
		setDraftCategories([])
		onApply({
			sort: DEFAULT_SORT,
			course: null,
			categories: [],
		})
		setOpen(false)
	}

	function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
		if (event.pointerType === 'mouse' && event.button !== 0) return
		dragStartYRef.current = event.clientY
		lastDragOffsetRef.current = 0
		suppressClickRef.current = false
		event.currentTarget.setPointerCapture(event.pointerId)
	}

	function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
		if (dragStartYRef.current === null) return
		const nextOffset = Math.max(0, event.clientY - dragStartYRef.current)
		lastDragOffsetRef.current = nextOffset
		setDragOffset(nextOffset)
	}

	function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
		if (dragStartYRef.current === null) return
		dragStartYRef.current = null
		event.currentTarget.releasePointerCapture(event.pointerId)

		if (lastDragOffsetRef.current > CLOSE_DRAG_DISTANCE) {
			suppressClickRef.current = true
			setOpen(false)
			return
		}

		suppressClickRef.current = lastDragOffsetRef.current > 6
		lastDragOffsetRef.current = 0
		setDragOffset(0)
	}

	function handleHandleClick() {
		if (suppressClickRef.current) {
			suppressClickRef.current = false
			return
		}
		setOpen(false)
	}

	return (
		<DialogPrimitive.Root
			open={isOpen}
			defaultOpen={false}
			onOpenChange={setOpen}
		>
			<DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-forest-700/60 transition-opacity duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
				<DialogPrimitive.Content
					data-testid='filters-sheet'
					aria-describedby={undefined}
					style={
						{
							'--filters-sheet-drag': `${dragOffset}px`,
						} as CSSProperties
					}
					className={cn(
						'filters-sheet fixed z-50 flex w-full flex-col overflow-hidden bg-forest-50 text-forest-300 shadow-center outline-none',
						'inset-x-0 bottom-0 max-h-[75dvh] rounded-t-4xl border border-forest-100 px-4 pb-[max(env(safe-area-inset-bottom),1rem)]',
						'translate-y-(--filters-sheet-drag) transition-transform duration-200 ease-out',
						'sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(92vw,34rem)] sm:max-h-[min(80vh,44rem)]',
						'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:px-5 sm:py-5',
					)}
				>
					<DialogPrimitive.Title className='sr-only'>
						{t('filters')}
					</DialogPrimitive.Title>
					<DialogPrimitive.Close className='absolute right-4 top-4 hidden rounded-sm ring-offset-white transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-neutral-100 data-[state=open]:text-forest-400 cursor-default sm:block'>
						<X className='h-4 w-4' />
						<span className='sr-only'>{t('filters-close')}</span>
					</DialogPrimitive.Close>
					<div className='flex shrink-0 justify-center pb-2 pt-1 sm:hidden'>
						<button
							type='button'
							data-testid='filters-sheet-handle'
							aria-label={t('filters-close')}
							onPointerDown={handlePointerDown}
							onPointerMove={handlePointerMove}
							onPointerUp={handlePointerUp}
							onPointerCancel={() => {
								dragStartYRef.current = null
								lastDragOffsetRef.current = 0
								setDragOffset(0)
							}}
							className='flex h-8 w-full touch-none select-none items-center justify-center'
						>
							<span className='h-1.5 w-12 rounded-full bg-forest-150' />
						</button>
					</div>
					<div
						data-testid='filters-sheet-content'
						className='min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-0.5 pr-1'
					>
						<section className='space-y-3'>
							<h3 className='text-left text-sm font-extrabold'>
								{t('sort-by')}
							</h3>
							<div className='flex flex-wrap gap-2'>
								{[
									{
										value: 'createdAt' as const,
										getLabel: (direction: SortDirection) =>
											direction === 'asc' ? t('sort-oldest') : t('sort-newest'),
									},
									{
										value: 'time' as const,
										getLabel: (direction: SortDirection) =>
											direction === 'asc'
												? t('sort-quickest')
												: t('sort-longest'),
									},
								].map((option) => {
									const isActive = getSortField(draftSort) === option.value
									const direction = getSortDirectionForField(
										option.value,
										draftSort,
									)
									const showsDirection = isActive

									return (
										<button
											key={option.value}
											type='button'
											onClick={() => selectSortField(option.value)}
											className={cn(
												'flex items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors',
												'text-forest-200 border-2 bg-forest-100 border-forest-150',
												isActive
													? ' bg-forest-200/75 font-bold text-forest-50 border-transparent py-1'
													: ' hover:bg-forest-200/75 hover:border-transparent hover:text-forest-50 py-2',
											)}
										>
											<span>{option.getLabel(direction)}</span>
											{showsDirection && (
												<div className='bg-forest-50 p-1 rounded-lg'>
													<ArrowUp
														size={15}
														className={cn(
															'stroke-forest-200/75 transition-transform duration-200',
															direction === 'desc' && 'rotate-180',
														)}
														aria-hidden='true'
														data-testid={`filters-sort-direction-${direction}`}
													/>
												</div>
											)}
										</button>
									)
								})}
							</div>
						</section>
						<section className='space-y-3'>
							<h3 className='text-left text-sm font-extrabold'>
								{t('course')}
							</h3>
							<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
								{RecipeCourses.map((course) => {
									const isActive = draftCourse === course

									return (
										<button
											type='button'
											key={course}
											onClick={() => selectCourse(course)}
											className={cn(
												'relative flex w-full text-forest-200 group flex-col border-2 bg-forest-100 border-forest-150 items-start justify-center rounded-xl px-3 py-2 transition-colors',
												isActive
													? ' text-forest-50 bg-forest-200/75 border-transparent'
													: '  hover:bg-forest-200/75 hover:text-forest-50 hover:border-transparent',
											)}
										>
											<div className='flex w-full items-center justify-between gap-2'>
												<Icon
													name={course}
													size={17}
													className={cn(
														'transition-colors duration-200 stroke-forest-200 group-hover:stroke-forest-50',
														isActive && 'stroke-forest-50',
													)}
												/>
											</div>
											<span
												className={cn(
													'mt-1 text-xs font-semibold leading-4 sm:text-sm',
													isActive && 'font-bold',
												)}
											>
												{t_courses(course.toLowerCase())}
											</span>
										</button>
									)
								})}
							</div>
						</section>
						<section className='space-y-3'>
							<h3 className='text-left text-sm font-extrabold'>
								{t('categories')}
							</h3>
							<div className='flex flex-wrap gap-2'>
								{RecipeCategories.map((category) => {
									const isActive = draftCategories.includes(category)
									const isDisabled =
										!isActive && draftCategories.length >= maxCategories

									return (
										<button
											type='button'
											key={category}
											onClick={() => toggleCategory(category)}
											disabled={isDisabled}
											className={cn(
												'inline-flex items-center justify-center rounded-xl text-xs px-3 py-1 transition-colors',
												'bg-forest-100 text-forest-200 border-2 border-forest-150',
												isActive
													? 'bg-forest-150 text-forest-200 font-bold  border-transparent'
													: ' hover:bg-forest-150 hover:text-forest-200 hover:border-transparent',
												isDisabled && 'cursor-not-allowed opacity-45',
											)}
										>
											{t_categories(category.toLowerCase())}
										</button>
									)
								})}
							</div>
						</section>
					</div>
					<div className='h-0.5 w-full rounded-full bg-forest-150 mt-5 mb-3' />
					<div className='grid shrink-0 grid-cols-2 gap-3 bg-forest-50'>
						<Button type='button' variant='outline' onClick={handleReset}>
							{t('reset')}
						</Button>
						<Button
							type='button'
							className='font-bold shadow-center-sm'
							onClick={handleApply}
						>
							{t('filter')}
						</Button>
					</div>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	)
}
