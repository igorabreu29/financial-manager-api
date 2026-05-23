import { AuthenticateWithCredentialsUseCase } from "@/domain/accounts/app/use-cases/authenticate-with-credentials.ts";
import { BcryptHasher } from "@/infra/cryptography/bcrypt-hasher.ts";
import { JWTEncrypter } from "@/infra/cryptography/jwt-encrypter.ts";
import { UsersRepositoryAdapter } from "@/infra/database/repositories/users-repository-adapter.ts";

export function makeAuthenticateWithCredentialsUseCase() {
	const usersRepository = new UsersRepositoryAdapter();
	const hasher = new BcryptHasher();
	const encrypter = new JWTEncrypter();

	// TODO: wire refreshTokensRepository once PrismaRefreshTokensRepository is available (Task 10)
	return new AuthenticateWithCredentialsUseCase(
		usersRepository,
		hasher,
		encrypter
	);
}
