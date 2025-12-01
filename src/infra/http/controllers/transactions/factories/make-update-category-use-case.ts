import { UpdateCategoryUseCase } from "@/domain/transactions/app/use-case/update-category.ts";
import { CategoriesRepositoryAdapter } from "@/infra/database/repositories/categories-repository-adapter.ts";

export function makeUpdateCategoryUseCase() {
	const categoriesRepository = new CategoriesRepositoryAdapter();
	return new UpdateCategoryUseCase(categoriesRepository);
}
