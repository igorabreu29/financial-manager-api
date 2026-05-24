import { RefreshTokenUseCase } from "@/domain/accounts/app/use-cases/refresh-token.ts";
import { JWTEncrypter } from "@/infra/cryptography/jwt-encrypter.ts";
import { RefreshTokensRepositoryAdapter } from "@/infra/database/repositories/refresh-tokens-repository-adapter.ts";

export function makeRefreshTokenUseCase() {
	const refreshTokensRepository = new RefreshTokensRepositoryAdapter();
	const encrypter = new JWTEncrypter();

	return new RefreshTokenUseCase(refreshTokensRepository, encrypter);
}
