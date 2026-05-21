import { CreateWalletUseCase } from "@/domain/transactions/app/use-case/create-wallet.ts";
import { WalletsRepositoryAdapter } from "@/infra/database/repositories/wallets-repository-adapter.ts";

export function makeCreateWalletUseCase() {
	const walletsRepository = new WalletsRepositoryAdapter();
	return new CreateWalletUseCase(walletsRepository);
}
