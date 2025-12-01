import type { PaginationParams } from "@/core/repositories/pagination-params.ts";
import type { Transaction } from "../../enterprise/entities/transaction.ts";
import type {
	FindByTransactionAndUserIdParams,
	FindManyProps,
	FindManyResponse,
} from "./types/transaction.ts";

export interface TransactionsRepository {
	findById(id: string): Promise<Transaction | null>;
	findByTransactionAndUserId(
		params: FindByTransactionAndUserIdParams
	): Promise<Transaction | null>;
	findManyByUserId(
		props: FindManyProps,
		pagination: PaginationParams
	): Promise<FindManyResponse>;
	create(transaction: Transaction): Promise<Transaction>;
	delete(transaction: Transaction): Promise<void>;
}
