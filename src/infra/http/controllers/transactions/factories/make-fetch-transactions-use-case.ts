import { FetchTransactionsUseCase } from "@/domain/transactions/app/use-case/fetch-transactions.ts";
import { TransactionsRepositoryAdapter } from "@/infra/database/repositories/transactions-repository-adapter.ts";

export function makeFetchTransactionsUseCase() {
	const transactionsRepository = new TransactionsRepositoryAdapter();
	return new FetchTransactionsUseCase(transactionsRepository);
}
