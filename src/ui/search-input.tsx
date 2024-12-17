import { useState, useRef } from 'react';

import { cn } from '@/utils';
import { useDebounce } from '@/hooks/useDebounce';

type SearchInputProps = {
	value: string;
	onQuery: (value: string) => void;
} & React.InputHTMLAttributes<HTMLInputElement>;
type SearchInputState = 'visible' | 'hidden' | 'outlined';

const SearchInput = ({ value, onQuery, className }: SearchInputProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const [status, setStatus] = useState<SearchInputState>('hidden');
	const debouncedStatus = useDebounce(status, 100);

	/**
	 * Change the status of the search input
	 */
	const changeStatus = () => {
		if (debouncedStatus === 'visible')
			setStatus(value != '' ? 'outlined' : 'hidden');
		else if (debouncedStatus === 'outlined' && value) setStatus('hidden');
		else {
			setStatus('visible');
			inputRef?.current?.focus();
		}
	};

	return (
		<div className={cn('flex relative left-7', className)}>
			<button
				onClick={changeStatus}
				className={cn(
					'relative left-0 flex items-center z-40',
					'transition-opacity duration-300',
					status === 'outlined' ? '' : 'opacity-100'
				)}>
				<svg
					className={cn(
						'w-4 h-4 transition-transform duration-300',
						status === 'hidden' ? 'text-forest-200' : 'text-forest-300',
						status === 'visible' ? 'transform rotate-90' : ''
					)}
					aria-hidden='true'
					xmlns='http://www.w3.org/2000/svg'
					fill='none'
					viewBox='0 0 20 20'>
					<path
						stroke='currentColor'
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth='2'
						d='m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z'
					/>
				</svg>
			</button>
			<input
				type='search'
				ref={inputRef}
				onBlur={changeStatus}
				value={value}
				onChange={(e) => onQuery(e.target.value)}
				id='default-search'
				className={cn(
					'relative block w-0 py-1.5 right-7 px-2 ps-8 text-sm z-10 bg-forest-200/15 text-forest-200 font-medium placeholder-forest-200/80 border-[1px]',
					'transition-all duration-500 border-l-[5px] border-forest-200 rounded-[5px] focus:outline-none',
					'focus:ring-1 focus:ring-forest-200',
					status === 'visible'
						? 'w-32 md:w-52 pointer-events-auto'
						: status === 'outlined'
							? 'w-32 md:w-52 focus:ring-0'
							: 'opacity-0 pointer-events-none'
				)}
				placeholder='Search'
				required
			/>
		</div>
	);
};
export { SearchInput };
