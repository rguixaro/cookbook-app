'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { useTranslations } from 'next-intl'

import { SearchInput } from '@/ui'

const SEARCH_DEBOUNCE_MS = 450

export const SearchProfiles = () => {
	const t = useTranslations('ProfilesPage')

	const searchParams = useSearchParams()
	const pathname = usePathname()
	const router = useRouter()

	const inputRef = useRef<HTMLInputElement>(null)

	const searchValue = searchParams.get('search')?.toString() || ''
	const [inputValue, setInputValue] = useState(searchValue)
	const inputValueRef = useRef(searchValue)

	useEffect(() => {
		if (inputRef.current && document.activeElement === inputRef.current) {
			return
		}

		inputValueRef.current = searchValue
		setInputValue(searchValue)
	}, [searchValue])

	const getSearchHref = (params: URLSearchParams) => {
		const query = params.toString()
		return query ? `${pathname}?${query}` : pathname
	}

	const replaceSearch = (value: string) => {
		const params = new URLSearchParams(searchParams)
		const nextSearch = value.trim()
		if (nextSearch) params.set('search', nextSearch)
		else params.delete('search')

		router.replace(getSearchHref(params), { scroll: false })
	}

	const handleSearch = useDebouncedCallback(
		(value: string) => replaceSearch(value),
		SEARCH_DEBOUNCE_MS,
	)

	const commitSearch = (value: string) => {
		handleSearch.cancel()
		replaceSearch(value)
	}

	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== 'Enter') return
		e.preventDefault()
		commitSearch(e.currentTarget.value)
	}

	const handleBlur = () => {
		if (handleSearch.isPending()) {
			commitSearch(inputRef.current?.value ?? inputValueRef.current)
		}
	}

	return (
		<div className='w-11/12 sm:w-3/5 lg:w-3/8 flex justify-center my-5'>
			<SearchInput
				placeholder={t('search')}
				value={inputValue}
				inputRef={inputRef}
				onBlur={handleBlur}
				onKeyDown={handleSearchKeyDown}
				onSearchButtonClick={() => inputRef.current?.focus()}
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
				}}
				wrapperClassName='h-12 w-72 max-w-[calc(100vw-3rem)] rounded-2xl bg-forest-100 px-5 py-2 sm:w-80 sm:max-w-80'
				inputClassName='h-8 w-full px-10 text-base opacity-100 pointer-events-auto'
				searchButtonClassName='left-5 bg-forest-100 hover:bg-forest-100'
				searchIconClassName='text-forest-300'
				clearButtonClassName='right-5'
			/>
		</div>
	)
}
