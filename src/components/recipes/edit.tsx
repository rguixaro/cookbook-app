import Link from 'next/link'
import { NotebookPen } from 'lucide-react'

import { Recipe } from '@/types'

export const RecipeEdit = ({ recipe }: { recipe: Recipe | null }) => {
	if (!recipe) return null

	return (
		<Link
			href={`/recipes/edit/${recipe?.authorId}/${recipe?.slug}`}
			className=' hover:bg-forest-200/15 p-1 rounded transition-colors duration-300'>
			<NotebookPen size={24} className='text-forest-200' />
		</Link>
	)
}
