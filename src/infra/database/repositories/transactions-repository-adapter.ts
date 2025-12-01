import type { PaginationParams } from "@/core/repositories/pagination-params.ts";
import type { TransactionsRepository } from "@/domain/transactions/app/repositories/transactions-repository.ts";
import type {
	FindByTransactionAndUserIdParams,
	FindManyProps,
	FindManyResponse,
} from "@/domain/transactions/app/repositories/types/transaction.ts";
import type { Transaction } from "@/domain/transactions/enterprise/entities/transaction.ts";
import type { TransactionWhereInput } from "../generated/prisma/models.ts";
import { TransactionMapper } from "../mappers/transaction-mapper.ts";
import { TransactionTypeMapper } from "../mappers/transaction-type-mapper.ts";
import { prisma } from "../prisma.ts";

export class TransactionsRepositoryAdapter implements TransactionsRepository {
	public async findById(id: string): Promise<Transaction | null> {
		const transaction = await prisma.transaction.findUnique({
			where: {
				id,
			},
		});

		if (!transaction) return null;

		return TransactionMapper.toDomain(transaction);
	}

	public async findByTransactionAndUserId({
		transactionId,
		userId,
	}: FindByTransactionAndUserIdParams): Promise<Transaction | null> {
		const transaction = await prisma.transaction.findUnique({
			where: {
				id: transactionId,
				userId,
			},
		});

		if (!transaction) return null;

		return TransactionMapper.toDomain(transaction);
	}

	public async findManyByUserId(
		{ query, type, userId }: FindManyProps,
		pagination: PaginationParams
	): Promise<FindManyResponse> {
		const whereFilter: TransactionWhereInput = {
			userId,
			description: {
				contains: query,
				mode: "insensitive",
			},
			...(type && {
				type: TransactionTypeMapper.toDatabase(type),
			}),
		};

		const transactions = await prisma.transaction.findMany({
			where: whereFilter,
			orderBy: {
				createdAt: "desc",
			},
			take: pagination.perPage,
			skip: (pagination.page - 1) * pagination.perPage,
		});

		const totalItems = await prisma.transaction.count({
			where: whereFilter,
		});

		const pages = Math.ceil(totalItems / pagination.perPage);

		return {
			pages,
			totalItems,
			transactions: transactions.map(TransactionMapper.toDomain),
		};
	}

	public async create(transaction: Transaction): Promise<Transaction> {
		const row = TransactionMapper.toDatabase(transaction);

		await prisma.transaction.create({ data: row });

		return transaction;
	}

	public async delete(transaction: Transaction): Promise<void> {
		await prisma.transaction.delete({
			where: {
				id: transaction.id.toValue(),
			},
		});
	}
}
