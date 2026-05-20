import { type Either, failure, success } from "@/core/either.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { Wallet } from "../../enterprise/entities/wallet.ts";
import type { WalletsRepository } from "../repositories/wallets-repository.ts";

interface UpdateWalletUseCaseRequest {
	walletId: string;
	userId: string;
	name: string;
	description: string | null;
}

type UpdateWalletUseCaseResponse = Either<
	ResourceNotFoundError,
	{
		wallet: Wallet;
	}
>;

export class UpdateWalletUseCase {
	constructor(private walletsRepository: WalletsRepository) {}

	async execute({
		walletId,
		userId,
		name,
		description,
	}: UpdateWalletUseCaseRequest): Promise<UpdateWalletUseCaseResponse> {
		const wallet = await this.walletsRepository.findByWalletAndUserId({
			walletId,
			userId,
		});

		if (!wallet) {
			return failure(new ResourceNotFoundError(`Wallet with id: ${walletId}`));
		}

		const updatedWallet = Wallet.create(
			{
				name,
				description,
				userId: wallet.props.userId,
				createdAt: wallet.props.createdAt,
			},
			wallet.id
		);

		await this.walletsRepository.update(updatedWallet);

		return success({ wallet: updatedWallet });
	}
}
