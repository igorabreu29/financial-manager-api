import { DisableCategoryUseCase } from "@/domain/transactions/app/use-case/disable-category.ts";
import { CategoriesRepositoryAdapter } from "@/infra/database/repositories/categories-repository-adapter.ts";

export function makeDisableCategoryUseCase() {
	const categoriesRepository = new CategoriesRepositoryAdapter();
	return new DisableCategoryUseCase(categoriesRepository);
}
