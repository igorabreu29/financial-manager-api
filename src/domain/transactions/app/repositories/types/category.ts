export interface FindByNameAndUserIdParams {
	userId: string;
	name: string;
}

export interface FindByCategoryAndUserIdParams {
	categoryId: string;
	userId: string;
}

export interface FindManyCategoriesProps {
	userId: string;
	name?: string;
	isGlobal?: boolean;
}

export interface FindManyActiveCategoriesByUserIdParams {
	userId: string;
	name?: string;
}
