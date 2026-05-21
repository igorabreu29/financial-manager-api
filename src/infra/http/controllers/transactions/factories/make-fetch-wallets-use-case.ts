import { FetchWalletsUseCase } from "@/domain/transactions/app/use-case/fetch-wallets.ts";
import { WalletsRepositoryAdapter } from "@/infra/database/repositories/wallets-repository-adapter.ts";

export function makeFetchWalletsUseCase() {
	const walletsRepository = new WalletsRepositoryAdapter();
	return new FetchWalletsUseCase(walletsRepository);
}
