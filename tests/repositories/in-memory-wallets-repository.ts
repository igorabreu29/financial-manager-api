import type { PaginationParams } from "@/core/repositories/pagination-params.ts";
import type { WalletsRepository } from "@/domain/transactions/app/repositories/wallets-repository.ts";
import type {
	FindByWalletAndUserIdParams,
	FindManyWalletsResponse,
} from "@/domain/transactions/app/repositories/types/wallet.ts";
import type { Wallet } from "@/domain/transactions/enterprise/entities/wallet.ts";

export class InMemoryWalletsRepository implements WalletsRepository {
	public wallets: Wallet[] = [];

	public async findById(id: string): Promise<Wallet | null> {
		return this.wallets.find(w => w.id.toValue() === id) ?? null;
	}

	public async findByWalletAndUserId({
		walletId,
		userId,
	}: FindByWalletAndUserIdParams): Promise<Wallet | null> {
		return (
			this.wallets.find(
				w =>
					w.id.toValue() === walletId &&
					w.props.userId.toValue() === userId
			) ?? null
		);
	}

	public async findManyByUserId(
		{ userId }: { userId: string },
		pagination: PaginationParams
	): Promise<FindManyWalletsResponse> {
		const userWallets = this.wallets
			.filter(w => w.props.userId.toValue() === userId)
			.sort(
				(a, b) =>
					b.props.createdAt.getTime() - a.props.createdAt.getTime()
			);

		const paginated = userWallets.slice(
			(pagination.page - 1) * pagination.perPage,
			pagination.page * pagination.perPage
		);

		return {
			wallets: paginated,
			totalItems: userWallets.length,
			pages: Math.ceil(userWallets.length / pagination.perPage),
		};
	}

	public async create(wallet: Wallet): Promise<Wallet> {
		this.wallets.push(wallet);
		return wallet;
	}

	public async update(wallet: Wallet): Promise<Wallet> {
		const index = this.wallets.findIndex(w => w.id.equals(wallet.id));
		this.wallets[index] = wallet;
		return wallet;
	}

	public async delete(wallet: Wallet): Promise<void> {
		const index = this.wallets.findIndex(w => w.id.equals(wallet.id));
		this.wallets.splice(index, 1);
	}
}
