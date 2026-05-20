import type { PaginationParamsResponse } from "@/core/repositories/pagination-params.ts";
import type { Wallet } from "@/domain/transactions/enterprise/entities/wallet.ts";

export interface FindManyWalletsResponse extends PaginationParamsResponse {
	wallets: Wallet[];
}

export interface FindByWalletAndUserIdParams {
	walletId: string;
	userId: string;
}
