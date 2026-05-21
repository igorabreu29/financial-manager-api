import { type Either, failure, success } from "@/core/either.ts";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import {
	Transaction,
	type TransactionType,
} from "../../enterprise/entities/transaction.ts";
import type { CategoriesRepository } from "../repositories/categories-repository.ts";
import type { TransactionsRepository } from "../repositories/transactions-repository.ts";
import type { WalletsRepository } from "../repositories/wallets-repository.ts";

interface CreateTransactionUseCaseRequest {
	description: string;
	type: TransactionType;
	price: number;
	categoryId: string;
	walletId: string;
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
		private categoriesRepository: CategoriesRepository,
		private walletsRepository: WalletsRepository
	) {}

	async execute({
		categoryId,
		walletId,
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
				new ResourceNotFoundError(`Category with id: ${categoryId}`)
			);
		}

		const wallet = await this.walletsRepository.findByWalletAndUserId({
			walletId,
			userId,
		});
		if (!wallet) {
			return failure(new ResourceNotFoundError(`Wallet with id: ${walletId}`));
		}

		const transaction = Transaction.create({
			categoryId: new UniqueEntityId(categoryId),
			walletId: new UniqueEntityId(walletId),
			userId: new UniqueEntityId(userId),
			description,
			price,
			type,
		});

		await this.transactionsRepository.create(transaction);

		return success({ transaction });
	}
}
