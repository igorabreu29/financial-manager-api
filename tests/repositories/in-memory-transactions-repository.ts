import type { PaginationParams } from "@/core/repositories/pagination-params.ts";
import type { TransactionsRepository } from "@/domain/transactions/app/repositories/transactions-repository.ts";
import type {
	FindByTransactionAndUserIdParams,
	FindManyProps,
	FindManyResponse,
} from "@/domain/transactions/app/repositories/types/transaction.ts";
import type { Transaction } from "@/domain/transactions/enterprise/entities/transaction.ts";

export class InMemoryTransactionsRepository implements TransactionsRepository {
	public transactions: Transaction[] = [];

	public async findById(id: string): Promise<Transaction | null> {
		const transaction = this.transactions.find(transaction => {
			return transaction.id.toValue() === id;
		});

		if (!transaction) {
			return null;
		}

		return transaction;
	}

	public async findByTransactionAndUserId({
		transactionId,
		userId,
	}: FindByTransactionAndUserIdParams): Promise<Transaction | null> {
		const transaction = this.transactions.find(transaction => {
			return (
				transaction.id.toValue() === transactionId &&
				transaction.props.userId.toValue() === userId
			);
		});

		if (!transaction) {
			return null;
		}

		return transaction;
	}

	public async findManyByUserId(
		{ query, type, userId }: FindManyProps,
		pagination: PaginationParams
	): Promise<FindManyResponse> {
		let transactions = this.transactions.filter(transaction => {
			return (
				transaction.props.userId.toValue() === userId &&
				transaction.props.description
					.toLowerCase()
					.includes(query ? query.toLowerCase() : "")
			);
		});

		if (type) {
			transactions = transactions.filter(transaction => {
				return transaction.props.type === type;
			});
		}

		transactions = transactions.sort((itemA, itemB) => {
			return itemB.props.createdAt.getTime() - itemA.props.createdAt.getTime();
		});

		const transactionsPaginated = transactions.slice(
			(pagination.page - 1) * pagination.perPage,
			pagination.page * pagination.perPage
		);
		const pages = Math.ceil(transactions.length / pagination.perPage);

		return {
			pages,
			totalItems: transactions.length,
			transactions: transactionsPaginated,
		};
	}

	public async create(transaction: Transaction): Promise<Transaction> {
		this.transactions.push(transaction);

		return transaction;
	}

	public async delete(transaction: Transaction): Promise<void> {
		const transactionIndex = this.transactions.findIndex(item => {
			return item.equals(transaction);
		});

		this.transactions.splice(transactionIndex, 1);
	}
}
