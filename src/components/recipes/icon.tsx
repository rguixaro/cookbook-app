import { icons } from 'lucide-react'

import type { RecipeCourse, RecipeTag } from '@/types'

type IconProps = {
	name: RecipeCourse | RecipeTag | string
	color?: string
	size?: number
}

const IconsByName = {
	starter: 'Dessert',
	firstcourse: 'Utensils',
	secondcourse: 'UtensilsCrossed',
	dessert: 'CakeSlice',
	pasta: 'Wheat',
	meat: 'Beef',
	fish: 'Fish',
	vegetable: 'Carrot',
	salad: 'Salad',
	soup: 'Soup',
	rice: 'Wheat',
	legume: 'Bean',
	seafood: 'Shrimp',
	fruit: 'Apple',
	stew: 'CookingPot',
	sauce: 'Flame',
	marinade: 'LeafyGreen',
	wok: 'Soup',
}

export const Icon = ({ name, color = '#789b84', size = 18 }: IconProps) => {
	const iconName =
		IconsByName[name.toLocaleLowerCase() as keyof typeof IconsByName] ??
		'UtensilsCrossed'
	const LucideIcon = icons[iconName as keyof typeof icons] ?? icons.Utensils

	return <LucideIcon color={color} size={size} className='shrink-0' />
}
