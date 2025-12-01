import { type Either, failure, success } from "@/core/either.ts";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import {
	Transaction,
	type TransactionType,
} from "../../enterprise/entities/transaction.ts";
import type { CategoriesRepository } from "../repositories/categories-repository.ts";
import type { TransactionsRepository } from "../repositories/transactions-repository.ts";

interface CreateTransactionUseCaseRequest {
	description: string;
	type: TransactionType;
	price: number;
	categoryId: string;
	userId: string;
}

type CreateTransactionUseCaseResponse = Either<
	ResourceNotFoundError,
	{
		transaction: Transaction;
	}
>;

export class CreateTransactionUseCase {
	constructor(
		private transactionsRepository: TransactionsRepository,
		private categoriesRepository: CategoriesRepository
	) {}

	async execute({
		categoryId,
		userId,
		description,
		price,
		type,
	}: CreateTransactionUseCaseRequest): Promise<CreateTransactionUseCaseResponse> {
		const category = await this.categoriesRepository.findByCategoryAndUserId({
			categoryId,
			userId,
		});
		if (!category) {
			return failure(
				new ResourceNotFoundError(`Transaction with ${categoryId}`)
			);
		}

		const transaction = Transaction.create({
			categoryId: new UniqueEntityId(categoryId),
			userId: new UniqueEntityId(userId),
			description,
			price,
			type,
		});

		await this.transactionsRepository.create(transaction);

		return success({
			transaction,
		});
	}
}
