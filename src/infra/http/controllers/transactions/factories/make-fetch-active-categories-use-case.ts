import { FetchActiveCategoriesUseCase } from "@/domain/transactions/app/use-case/fetch-active-categories.ts";
import { CategoriesRepositoryAdapter } from "@/infra/database/repositories/categories-repository-adapter.ts";

export function makeFetchActiveCategoriesUseCase() {
	const categoriesRepository = new CategoriesRepositoryAdapter();
	return new FetchActiveCategoriesUseCase(categoriesRepository);
}
