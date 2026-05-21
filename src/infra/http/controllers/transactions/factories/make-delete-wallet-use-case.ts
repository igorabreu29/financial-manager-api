import { DeleteWalletUseCase } from "@/domain/transactions/app/use-case/delete-wallet.ts";
import { WalletsRepositoryAdapter } from "@/infra/database/repositories/wallets-repository-adapter.ts";

export function makeDeleteWalletUseCase() {
	const walletsRepository = new WalletsRepositoryAdapter();
	return new DeleteWalletUseCase(walletsRepository);
}
