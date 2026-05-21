import { UpdateWalletUseCase } from "@/domain/transactions/app/use-case/update-wallet.ts";
import { WalletsRepositoryAdapter } from "@/infra/database/repositories/wallets-repository-adapter.ts";

export function makeUpdateWalletUseCase() {
	const walletsRepository = new WalletsRepositoryAdapter();
	return new UpdateWalletUseCase(walletsRepository);
}
