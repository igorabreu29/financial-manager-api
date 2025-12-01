import { type Either, failure, success } from "@/core/either.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import type { Hasher } from "../cryptography/hasher.ts";
import type { TokensRepository } from "../repositories/tokens-repository.ts";
import type { UsersRepository } from "../repositories/users-repository.ts";
import { InvalidCodeError } from "./errors/invalid-code-error.ts";
import { PasswordsDontMatch } from "./errors/passwords-dont-match.ts";

export interface ResetPasswordUseCaseRequest {
	code: string;
	password: string;
	confirmPassword: string;
}

export type ResetPasswordUseCaseResponse = Either<
	PasswordsDontMatch | ResourceNotFoundError | InvalidCodeError,
	null
>;

export class ResetPasswordUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private tokensRepository: TokensRepository,
		private hasher: Hasher
	) {}

	async execute({
		code,
		password,
		confirmPassword,
	}: ResetPasswordUseCaseRequest): Promise<ResetPasswordUseCaseResponse> {
		const token = await this.tokensRepository.findById(code);
		if (!token) {
			return failure(new InvalidCodeError(code));
		}

		const user = await this.usersRepository.findById(
			token.props.userId.toValue()
		);
		if (!user) {
			return failure(new ResourceNotFoundError("User"));
		}

		if (password !== confirmPassword) {
			return failure(new PasswordsDontMatch());
		}

		const passwordMatch = await this.hasher.hash(password);

		user.updatePassword(passwordMatch);

		await Promise.all([
			this.usersRepository.save(user),
			this.tokensRepository.delete(token),
		]);

		return success(null);
	}
}
