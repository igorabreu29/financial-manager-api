import { RequestCodeToChangePasswordUseCase } from "@/domain/accounts/app/use-cases/request-code-to-change-password.ts";
import { TokensRepositoryAdapter } from "@/infra/database/repositories/tokens-repository-adapter.ts";
import { UsersRepositoryAdapter } from "@/infra/database/repositories/users-repository-adapter.ts";
import { NodeMailer } from "@/infra/mail/mailer.ts";

export function makeRequestCodeToChangePasswordUseCase() {
	const usersRepository = new UsersRepositoryAdapter();
	const tokensRepository = new TokensRepositoryAdapter();
	const mailer = new NodeMailer();

	return new RequestCodeToChangePasswordUseCase(
		usersRepository,
		tokensRepository,
		mailer
	);
}
