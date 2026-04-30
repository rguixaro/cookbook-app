import { icons } from 'lucide-react'

import type { RecipeCourse, RecipeCategory } from '@/types'

type IconProps = {
	name: RecipeCourse | RecipeCategory | string
	className?: string
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

export const Icon = ({
	name,
	className = 'stroke-forest-200',
	size = 18,
}: IconProps) => {
	const iconName =
		IconsByName[name.toLocaleLowerCase() as keyof typeof IconsByName] ??
		'UtensilsCrossed'
	const LucideIcon = icons[iconName as keyof typeof icons] ?? icons.Utensils

	return <LucideIcon size={size} className={className} />
}
