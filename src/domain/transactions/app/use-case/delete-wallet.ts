import { type Either, failure, success } from "@/core/either.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import type { WalletsRepository } from "../repositories/wallets-repository.ts";

interface DeleteWalletUseCaseRequest {
	walletId: string;
	userId: string;
}

type DeleteWalletUseCaseResponse = Either<ResourceNotFoundError, null>;

export class DeleteWalletUseCase {
	constructor(private walletsRepository: WalletsRepository) {}

	async execute({
		walletId,
		userId,
	}: DeleteWalletUseCaseRequest): Promise<DeleteWalletUseCaseResponse> {
		const wallet = await this.walletsRepository.findByWalletAndUserId({
			walletId,
			userId,
		});

		if (!wallet) {
			return failure(new ResourceNotFoundError(`Wallet with id: ${walletId}`));
		}

		await this.walletsRepository.delete(wallet);

		return success(null);
	}
}
