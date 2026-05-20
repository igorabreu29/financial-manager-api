import type { PaginationParams } from "@/core/repositories/pagination-params.ts";
import type { Wallet } from "@/domain/transactions/enterprise/entities/wallet.ts";
import type {
	FindByWalletAndUserIdParams,
	FindManyWalletsResponse,
} from "./types/wallet.ts";

export interface WalletsRepository {
	findById(id: string): Promise<Wallet | null>;
	findByWalletAndUserId(
		params: FindByWalletAndUserIdParams
	): Promise<Wallet | null>;
	findManyByUserId(
		props: { userId: string },
		pagination: PaginationParams
	): Promise<FindManyWalletsResponse>;
	create(wallet: Wallet): Promise<Wallet>;
	update(wallet: Wallet): Promise<Wallet>;
	delete(wallet: Wallet): Promise<void>;
}
