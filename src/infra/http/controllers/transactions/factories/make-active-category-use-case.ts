import { ActiveCategoryUseCase } from "@/domain/transactions/app/use-case/active-category.ts";
import { CategoriesRepositoryAdapter } from "@/infra/database/repositories/categories-repository-adapter.ts";

export function makeActiveCategoryUseCase() {
	const categoriesRepository = new CategoriesRepositoryAdapter();
	return new ActiveCategoryUseCase(categoriesRepository);
}
