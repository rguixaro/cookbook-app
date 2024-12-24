export const Categories = [
	'Starter',
	'Pasta',
	'Meat',
	'Fish',
	'Vegetable',
	'Salad',
	'Soup',
	'Dessert',
];

export type Categories = (typeof Categories)[number];

export interface Recipe {
	id: string;
	slug: string;
	name: string;
	time: number | undefined;
	instructions: string;
	ingredients: string[];
	createdAt: Date;
	updatedAt: Date;
	category: Categories;
	authorId: string;
}
