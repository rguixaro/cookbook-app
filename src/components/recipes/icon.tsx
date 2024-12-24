import { icons } from 'lucide-react';

import { Categories } from '@/types';

type IconProps = {
	name: Categories;
	color?: string;
	size?: number;
};

const IconsByCategory = {
	starter: 'Dessert',
	pasta: 'UtensilsCrossed',
	meat: 'Beef',
	fish: 'FishSymbol',
	vegetable: 'Carrot',
	salad: 'Salad',
	soup: 'Soup',
	dessert: 'CakeSlice',
};

export const Icon = ({ name, color = '#789B84', size = 18 }: IconProps) => {
	const iconName =
		IconsByCategory[name.toLocaleLowerCase() as keyof typeof IconsByCategory];
	const LucideIcon = icons[iconName as keyof typeof icons];

	return <LucideIcon color={color} size={size} />;
};
