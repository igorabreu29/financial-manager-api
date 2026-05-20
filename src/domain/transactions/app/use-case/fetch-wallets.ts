import { type Either, success } from "@/core/either.ts";
import type { Wallet } from "../../enterprise/entities/wallet.ts";
import type { WalletsRepository } from "../repositories/wallets-repository.ts";

interface FetchWalletsUseCaseRequest {
	userId: string;
	page?: number;
	perPage?: number;
}

type FetchWalletsUseCaseResponse = Either<
	null,
	{
		wallets: Wallet[];
		totalItems: number;
		pages: number;
	}
>;

export class FetchWalletsUseCase {
	constructor(private walletsRepository: WalletsRepository) {}

	async execute({
		userId,
		page = 1,
		perPage = 10,
	}: FetchWalletsUseCaseRequest): Promise<FetchWalletsUseCaseResponse> {
		const { wallets, totalItems, pages } =
			await this.walletsRepository.findManyByUserId(
				{ userId },
				{ page, perPage }
			);

		return success({ wallets, totalItems, pages });
	}
}
