import type { Category } from "@/domain/transactions/enterprise/entities/category.ts";
import type {
	FindByCategoryAndUserIdParams,
	FindByNameAndUserIdParams,
	FindManyActiveCategoriesByUserIdParams,
	FindManyCategoriesProps,
} from "./types/category.ts";

export interface CategoriesRepository {
	findById(id: string): Promise<Category | null>;
	findByName(name: string): Promise<Category | null>;
	findByCategoryAndUserId(
		params: FindByCategoryAndUserIdParams
	): Promise<Category | null>;
	findByNameAndUserId(
		params: FindByNameAndUserIdParams
	): Promise<Category | null>;
	findManyByUserId(params: FindManyCategoriesProps): Promise<Category[]>;
	findManyActivesByUserId(
		params: FindManyActiveCategoriesByUserIdParams
	): Promise<Category[]>;
	create(category: Category): Promise<Category>;
	createMany(categories: Category[]): Promise<void>;
	save(category: Category): Promise<void>;
	delete(category: Category): Promise<void>;
}
