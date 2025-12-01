import { type Either, failure, success } from "@/core/either.ts";
import { Token } from "../../enterprise/entities/token.ts";
import type { Mailer } from "../mail/mailer.ts";
import type { TokensRepository } from "../repositories/tokens-repository.ts";
import type { UsersRepository } from "../repositories/users-repository.ts";
import { WrongCredentialsError } from "./errors/wrong-credentials-error.ts";

export interface RequestCodeToChangePasswordUseCaseRequest {
	email: string;
}

export type RequestCodeToChangePasswordUseCaseResponse = Either<
	WrongCredentialsError,
	null
>;

export class RequestCodeToChangePasswordUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private tokensRepository: TokensRepository,
		private mailer: Mailer
	) {}

	async execute({
		email,
	}: RequestCodeToChangePasswordUseCaseRequest): Promise<RequestCodeToChangePasswordUseCaseResponse> {
		const userWithEmail = await this.usersRepository.findByEmail(email);
		if (!userWithEmail) {
			return failure(new WrongCredentialsError());
		}

		const token = Token.create({
			type: "password_recover",
			userId: userWithEmail.id,
		});
		await this.tokensRepository.create(token);

		await this.mailer.sendEmail({
			to: userWithEmail.props.email,
			code: token.id.toValue(),
		});

		return success(null);
	}
}
