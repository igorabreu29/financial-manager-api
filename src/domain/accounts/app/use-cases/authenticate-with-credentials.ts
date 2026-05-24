import { randomUUID } from "node:crypto";
import { type Either, failure, success } from "@/core/either.ts";
import {
	REFRESH_TOKEN_TTL_MS,
	RefreshToken,
} from "../../enterprise/entities/refresh-token.ts";
import type { User } from "../../enterprise/entities/user.ts";
import type { Encrypter } from "../cryptography/encrypter.ts";
import type { Hasher } from "../cryptography/hasher.ts";
import type { RefreshTokensRepository } from "../repositories/refresh-tokens-repository.ts";
import type { UsersRepository } from "../repositories/users-repository.ts";
import { WrongCredentialsError } from "./errors/wrong-credentials-error.ts";

interface AuthenticateWithCredentialsUseCaseRequest {
	email: string;
	password: string;
}

type AuthenticateWithCredentialsUseCaseResponse = Either<
	WrongCredentialsError,
	{
		accessToken: string;
		refreshToken: string;
		user: User;
	}
>;

export class AuthenticateWithCredentialsUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private hasher: Hasher,
		private encrypter: Encrypter,
		private refreshTokensRepository: RefreshTokensRepository
	) {}

	public async execute({
		email,
		password,
	}: AuthenticateWithCredentialsUseCaseRequest): Promise<AuthenticateWithCredentialsUseCaseResponse> {
		const user = await this.usersRepository.findByEmail(email);
		if (!user) return failure(new WrongCredentialsError());

		const passwordsMatch = await this.hasher.compare(
			password,
			user.props.passwordHash
		);
		if (!passwordsMatch) return failure(new WrongCredentialsError());

		const accessToken = this.encrypter.encrypt({
			sub: user.id.toValue(),
		});

		const refreshTokenValue = randomUUID();
		const refreshToken = RefreshToken.create({
			userId: user.id,
			token: refreshTokenValue,
			expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
		});

		await this.refreshTokensRepository.create(refreshToken);

		return success({
			accessToken,
			refreshToken: refreshTokenValue,
			user,
		});
	}
}
