import { getAuthorsByName } from '@/server/queries'
import { Info } from '@/components/layout'
import { ItemAuthor } from '@/components/authors'

export const AuthorsFeed = async ({ searchParam }: { searchParam?: string }) => {
	const data = await getAuthorsByName(searchParam || '')

	const authors = Array.isArray(data) ? [] : (data?.authors ?? [])

	return (
		<div className='w-full flex flex-col items-center space-y-4'>
			{authors.map((author) => (
				<ItemAuthor key={author.id} author={author} query={searchParam} />
			))}
			<Info
				enabled={searchParam != null && authors?.length === 0}
				mode='authors'
			/>
		</div>
	)
}
