import { DeleteCategoryUseCase } from "@/domain/transactions/app/use-case/delete-category.ts";
import { CategoriesRepositoryAdapter } from "@/infra/database/repositories/categories-repository-adapter.ts";

export function makeDeleteCategoryUseCase() {
	const categoriesRepository = new CategoriesRepositoryAdapter();
	return new DeleteCategoryUseCase(categoriesRepository);
}
