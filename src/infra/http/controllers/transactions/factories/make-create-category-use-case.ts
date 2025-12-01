import { CreateCategoryUseCase } from "@/domain/transactions/app/use-case/create-category.ts";
import { CategoriesRepositoryAdapter } from "@/infra/database/repositories/categories-repository-adapter.ts";

export function makeCreateCategoryUseCase() {
	const categoriesRepository = new CategoriesRepositoryAdapter();
	return new CreateCategoryUseCase(categoriesRepository);
}
