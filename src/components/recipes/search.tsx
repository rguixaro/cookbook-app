'use client';

import { useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { AnimatePresence } from 'motion/react';
import * as motion from 'motion/react-client';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

import { useDebounce } from '@/hooks';
import { UserButton } from '@/components/auth';
import { SearchIcon } from '@/components/icons';
import { Categories as CategoriesType } from '@/types';
import { Button, TypographyH4 } from '@/ui';
import { cn } from '@/utils';
import { Categories } from './categories';

type SearchState = 'visible' | 'hidden' | 'outlined';

export const SearchRecipes = ({ withAvatar = true }: { withAvatar?: boolean }) => {
	const t = useTranslations('RecipesPage');

	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();

	const inputRef = useRef<HTMLInputElement>(null);

	const [status, setStatus] = useState<SearchState>('hidden');
	const debouncedStatus = useDebounce(status, 100);

	const [category, setCategory] = useState<CategoriesType | null>(
		searchParams.get('category')?.toString() || null
	);

	/**
	 * Handle the search input
	 * @param e
	 */
	const handleSearch = useDebouncedCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const params = new URLSearchParams(searchParams);
			if (e.target.value) params.set('search', e.target.value);
			else params.delete('search');

			router.replace(`${pathname}?${params.toString()}`);
		},
		300
	);

	/**
	 * Handle the category selection
	 * @param category
	 */
	const handleSelect = useDebouncedCallback((category: string) => {
		const params = new URLSearchParams(searchParams);
		if (category) {
			params.set('category', category);
			setCategory(category);
		} else {
			params.delete('category');
			setCategory(null);
		}
		router.replace(`${pathname}?${params.toString()}`);
	}, 300);

	const handleRemoveCategory = (e: React.MouseEvent<HTMLElement>) => {
		e.preventDefault();
		const params = new URLSearchParams(searchParams);
		params.delete('category');
		setCategory(null);
		router.replace(`${pathname}?${params.toString()}`);
	};

	/**
	 * Change the status of the search input
	 */
	const onStatusChange = () => {
		const value = inputRef.current?.value;
		if (debouncedStatus === 'visible')
			setStatus(value != '' ? 'outlined' : 'hidden');
		else if (debouncedStatus === 'outlined' && value) setStatus('hidden');
		else {
			setStatus('visible');
			inputRef?.current?.focus();
		}
	};

	return (
		<div className='sticky top-24 h-28 bg-[#fefff2] w-full'>
			<div className='w-full flex items-center justify-between mb-2'>
				<TypographyH4 className='ms-3'>
					{t('title').toUpperCase()}
				</TypographyH4>
				<div className='flex items-center'>
					<div
						className={cn(
							'flex duration-300 transition-transform',
							withAvatar
								? status !== 'hidden'
									? 'translate-x-14 sm:translate-x-0'
									: 'translate-x-8'
								: 'translate-x-8'
						)}>
						<button
							onClick={onStatusChange}
							className={cn(
								'flex items-center z-40 transition-opacity duration-300',
								status === 'outlined' ? '' : 'opacity-100'
							)}>
							<SearchIcon
								className={cn(
									'w-4 h-4 transition-transform duration-300',
									status === 'visible'
										? 'transform rotate-90'
										: '',
									status === 'hidden'
										? 'text-forest-200'
										: 'text-forest-300'
								)}
							/>
						</button>
						<input
							type='search'
							ref={inputRef}
							placeholder={t('search')}
							onBlur={onStatusChange}
							defaultValue={searchParams.get('search')?.toString()}
							onChange={handleSearch}
							id='default-search'
							className={cn(
								'relative block w-0 py-1.5 right-7 px-2 ps-8 text-sm z-10 bg-forest-200/15 text-forest-200 font-medium placeholder-forest-200/80 border-[1px]',
								'transition-all duration-500 border-l-[5px] border-forest-200 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-forest-200',
								status === 'visible'
									? 'w-32 md:w-52 pointer-events-auto'
									: status === 'outlined'
										? 'w-32 md:w-52 focus:ring-0'
										: 'opacity-0 pointer-events-none'
							)}
							required
						/>
					</div>
					{withAvatar && (
						<UserButton
							className={cn(
								status !== 'hidden' &&
									'opacity-0 sm:opacity-100 translate-x-4 sm:translate-x-0 pointer-events-none sm:pointer-events-auto'
							)}
						/>
					)}
				</div>
			</div>
			<Categories
				onSelect={handleSelect}
				selected={category}
				trigger={
					<div className='flex w-full space-x-3'>
						<Button variant={'default'} size={'sm'}>
							<span className='text-base md:text-lg font-bold'>
								{t('categories')}
							</span>
						</Button>
						<AnimatePresence>
							{category && (
								<motion.div
									key='selected-category'
									initial={{ opacity: 0, x: -100 }}
									animate={{
										opacity: 1,
										x: 0,
										transition: { duration: 0.5, delay: 0.1 },
									}}
									exit={{
										opacity: 0,
										x: -100,
										transition: { duration: 0.5, delay: 0.1 },
									}}
									className='bg-forest-200/80 rounded-full text-white flex items-center'>
									<button
										onClick={handleRemoveCategory}
										className='flex items-center justify-center px-3 space-x-2'>
										<span className='font-semibold text-sm md:text-base'>
											{category}
										</span>
										<X size={14} className='mt-0.5' />
									</button>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				}
			/>
		</div>
	);
};
