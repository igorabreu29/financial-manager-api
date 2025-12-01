import { DeleteTransactionUseCase } from "@/domain/transactions/app/use-case/delete-transaction.ts";
import { TransactionsRepositoryAdapter } from "@/infra/database/repositories/transactions-repository-adapter.ts";

export function makeDeleteTransactionUseCase() {
	const transactionsRepository = new TransactionsRepositoryAdapter();
	return new DeleteTransactionUseCase(transactionsRepository);
}
