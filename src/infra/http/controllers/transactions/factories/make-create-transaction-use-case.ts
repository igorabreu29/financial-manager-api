import { CreateTransactionUseCase } from "@/domain/transactions/app/use-case/create-transaction.ts";
import { CategoriesRepositoryAdapter } from "@/infra/database/repositories/categories-repository-adapter.ts";
import { TransactionsRepositoryAdapter } from "@/infra/database/repositories/transactions-repository-adapter.ts";
import { WalletsRepositoryAdapter } from "@/infra/database/repositories/wallets-repository-adapter.ts";

export function makeCreateTransactionUseCase() {
	const transactionsRepository = new TransactionsRepositoryAdapter();
	const categoriesRepository = new CategoriesRepositoryAdapter();
	const walletsRepository = new WalletsRepositoryAdapter();
	return new CreateTransactionUseCase(
		transactionsRepository,
		categoriesRepository,
		walletsRepository
	);
}
