import { FetchCategoriesUseCase } from "@/domain/transactions/app/use-case/fetch-categories.ts";
import { CategoriesRepositoryAdapter } from "@/infra/database/repositories/categories-repository-adapter.ts";

export function makeFetchCategoriesUseCase() {
	const categoriesRepository = new CategoriesRepositoryAdapter();
	return new FetchCategoriesUseCase(categoriesRepository);
}
