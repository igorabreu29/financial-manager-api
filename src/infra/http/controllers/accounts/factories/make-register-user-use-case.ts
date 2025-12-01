import { RegisterUserUseCase } from "@/domain/accounts/app/use-cases/register-user.ts";
import { BcryptHasher } from "@/infra/cryptography/bcrypt-hasher.ts";
import { UsersRepositoryAdapter } from "@/infra/database/repositories/users-repository-adapter.ts";

export function makeRegisterUserUseCase() {
	const usersRepository = new UsersRepositoryAdapter();
	const hasher = new BcryptHasher();

	return new RegisterUserUseCase(usersRepository, hasher);
}
