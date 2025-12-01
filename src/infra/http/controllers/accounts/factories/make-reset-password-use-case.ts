import { ResetPasswordUseCase } from "@/domain/accounts/app/use-cases/reset-password.ts";
import { BcryptHasher } from "@/infra/cryptography/bcrypt-hasher.ts";
import { TokensRepositoryAdapter } from "@/infra/database/repositories/tokens-repository-adapter.ts";
import { UsersRepositoryAdapter } from "@/infra/database/repositories/users-repository-adapter.ts";

export function makeResetPasswordUseCase() {
	const usersRepository = new UsersRepositoryAdapter();
	const tokensRepository = new TokensRepositoryAdapter();
	const hasher = new BcryptHasher();

	return new ResetPasswordUseCase(usersRepository, tokensRepository, hasher);
}
