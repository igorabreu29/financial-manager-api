import type { PaginationParamsResponse } from "@/core/repositories/pagination-params.ts";
import type {
	Transaction,
	TransactionType,
} from "@/domain/transactions/enterprise/entities/transaction.ts";

export interface FindManyResponse extends PaginationParamsResponse {
	transactions: Transaction[];
}

export interface FindManyProps {
	userId: string;
	query?: string;
	type?: TransactionType;
}

export interface FindByTransactionAndUserIdParams {
	transactionId: string;
	userId: string;
}
