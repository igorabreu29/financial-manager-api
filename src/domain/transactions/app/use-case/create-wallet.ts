import { type Either, success } from "@/core/either.ts";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { Wallet } from "../../enterprise/entities/wallet.ts";
import type { WalletsRepository } from "../repositories/wallets-repository.ts";

interface CreateWalletUseCaseRequest {
	name: string;
	description?: string | null;
	userId: string;
}

type CreateWalletUseCaseResponse = Either<
	null,
	{
		wallet: Wallet;
	}
>;

export class CreateWalletUseCase {
	constructor(private walletsRepository: WalletsRepository) {}

	async execute({
		name,
		description,
		userId,
	}: CreateWalletUseCaseRequest): Promise<CreateWalletUseCaseResponse> {
		const wallet = Wallet.create({
			name,
			description: description ?? null,
			userId: new UniqueEntityId(userId),
		});

		await this.walletsRepository.create(wallet);

		return success({ wallet });
	}
}
