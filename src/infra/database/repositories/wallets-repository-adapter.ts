import type { PaginationParams } from "@/core/repositories/pagination-params.ts";
import type { WalletsRepository } from "@/domain/transactions/app/repositories/wallets-repository.ts";
import type {
	FindByWalletAndUserIdParams,
	FindManyWalletsResponse,
} from "@/domain/transactions/app/repositories/types/wallet.ts";
import type { Wallet } from "@/domain/transactions/enterprise/entities/wallet.ts";
import { WalletMapper } from "../mappers/wallet-mapper.ts";
import { prisma } from "../prisma.ts";

export class WalletsRepositoryAdapter implements WalletsRepository {
	public async findById(id: string): Promise<Wallet | null> {
		const wallet = await prisma.wallet.findUnique({ where: { id } });
		if (!wallet) return null;
		return WalletMapper.toDomain(wallet);
	}

	public async findByWalletAndUserId({
		walletId,
		userId,
	}: FindByWalletAndUserIdParams): Promise<Wallet | null> {
		const wallet = await prisma.wallet.findFirst({
			where: { id: walletId, userId },
		});
		if (!wallet) return null;
		return WalletMapper.toDomain(wallet);
	}

	public async findManyByUserId(
		{ userId }: { userId: string },
		pagination: PaginationParams
	): Promise<FindManyWalletsResponse> {
		const wallets = await prisma.wallet.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			take: pagination.perPage,
			skip: (pagination.page - 1) * pagination.perPage,
		});

		const totalItems = await prisma.wallet.count({ where: { userId } });
		const pages = Math.ceil(totalItems / pagination.perPage);

		return { wallets: wallets.map(WalletMapper.toDomain), totalItems, pages };
	}

	public async create(wallet: Wallet): Promise<Wallet> {
		const row = WalletMapper.toDatabase(wallet);
		await prisma.wallet.create({ data: row });
		return wallet;
	}

	public async update(wallet: Wallet): Promise<Wallet> {
		const row = WalletMapper.toDatabase(wallet);
		await prisma.wallet.update({ where: { id: row.id }, data: row });
		return wallet;
	}

	public async delete(wallet: Wallet): Promise<void> {
		await prisma.wallet.delete({ where: { id: wallet.id.toValue() } });
	}
}
