import { icons } from 'lucide-react';

import { CategoryType } from '@/types';

type IconProps = {
	name: CategoryType;
	color?: string;
	size?: number;
};

const IconsByCategory = {
	pasta: 'UtensilsCrossed',
	meat: 'Beef',
	fish: 'FishSymbol',
	vegetable: 'Carrot',
	salad: 'Salad',
	soup: 'Soup',
	desert: 'CakeSlice',
};

export const Icon = ({ name, color = '#789B84', size = 18 }: IconProps) => {
	const iconName = IconsByCategory[name];
	const LucideIcon = icons[iconName as keyof typeof icons];

	return <LucideIcon color={color} size={size} />;
};
