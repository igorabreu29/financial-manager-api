import { OnUserRegistered } from "@/domain/transactions/app/subscribers/on-user-registered.ts";
import { CategoriesRepositoryAdapter } from "@/infra/database/repositories/categories-repository-adapter.ts";

export function makeOnUserRegisteredSubscriber() {
	const categoriesRepository = new CategoriesRepositoryAdapter();
	return new OnUserRegistered(categoriesRepository);
}
