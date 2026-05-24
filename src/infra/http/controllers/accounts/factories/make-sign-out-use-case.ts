import { SignOutUseCase } from "@/domain/accounts/app/use-cases/sign-out.ts";
import { RefreshTokensRepositoryAdapter } from "@/infra/database/repositories/refresh-tokens-repository-adapter.ts";

export function makeSignOutUseCase() {
	const refreshTokensRepository = new RefreshTokensRepositoryAdapter();
	return new SignOutUseCase(refreshTokensRepository);
}
