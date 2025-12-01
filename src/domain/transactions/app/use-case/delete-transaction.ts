import { type Either, failure, success } from "@/core/either.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import type { TransactionsRepository } from "../repositories/transactions-repository.ts";

interface DeleteTransactionUseCaseRequest {
	transactionId: string;
	userId: string;
}

type DeleteTransactionUseCaseResponse = Either<ResourceNotFoundError, null>;

export class DeleteTransactionUseCase {
	constructor(private transactionsRepository: TransactionsRepository) {}

	async execute({
		transactionId,
		userId,
	}: DeleteTransactionUseCaseRequest): Promise<DeleteTransactionUseCaseResponse> {
		const transaction =
			await this.transactionsRepository.findByTransactionAndUserId({
				transactionId,
				userId,
			});

		if (!transaction) return failure(new ResourceNotFoundError(transactionId));

		await this.transactionsRepository.delete(transaction);

		return success(null);
	}
}
