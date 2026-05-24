import { AuthenticateWithCredentialsUseCase } from "@/domain/accounts/app/use-cases/authenticate-with-credentials.ts";
import { BcryptHasher } from "@/infra/cryptography/bcrypt-hasher.ts";
import { JWTEncrypter } from "@/infra/cryptography/jwt-encrypter.ts";
import { RefreshTokensRepositoryAdapter } from "@/infra/database/repositories/refresh-tokens-repository-adapter.ts";
import { UsersRepositoryAdapter } from "@/infra/database/repositories/users-repository-adapter.ts";

export function makeAuthenticateWithCredentialsUseCase() {
	const usersRepository = new UsersRepositoryAdapter();
	const hasher = new BcryptHasher();
	const encrypter = new JWTEncrypter();
	const refreshTokensRepository = new RefreshTokensRepositoryAdapter();

	return new AuthenticateWithCredentialsUseCase(
		usersRepository,
		hasher,
		encrypter,
		refreshTokensRepository
	);
}
