import { randomUUID } from "node:crypto";
import { type Either, failure, success } from "@/core/either.ts";
import {
	RefreshToken,
	REFRESH_TOKEN_TTL_MS,
} from "../../enterprise/entities/refresh-token.ts";
import type { Encrypter } from "../cryptography/encrypter.ts";
import type { RefreshTokensRepository } from "../repositories/refresh-tokens-repository.ts";
import { InvalidRefreshTokenError } from "./errors/invalid-refresh-token-error.ts";

interface RefreshTokenUseCaseRequest {
	token: string;
}

type RefreshTokenUseCaseResponse = Either<
	InvalidRefreshTokenError,
	{
		accessToken: string;
		refreshToken: string;
	}
>;

export class RefreshTokenUseCase {
	constructor(
		private refreshTokensRepository: RefreshTokensRepository,
		private encrypter: Encrypter
	) {}

	public async execute({
		token,
	}: RefreshTokenUseCaseRequest): Promise<RefreshTokenUseCaseResponse> {
		const existingToken = await this.refreshTokensRepository.findByToken(token);

		if (!existingToken) return failure(new InvalidRefreshTokenError());

		if (existingToken.props.expiresAt < new Date()) {
			await this.refreshTokensRepository.delete(existingToken);
			return failure(new InvalidRefreshTokenError());
		}

		await this.refreshTokensRepository.delete(existingToken);

		const newRefreshTokenValue = randomUUID();
		const newRefreshToken = RefreshToken.create({
			userId: existingToken.props.userId,
			token: newRefreshTokenValue,
			expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
		});

		await this.refreshTokensRepository.create(newRefreshToken);

		const accessToken = this.encrypter.encrypt({
			sub: existingToken.props.userId.toValue(),
		});

		return success({ accessToken, refreshToken: newRefreshTokenValue });
	}
}
