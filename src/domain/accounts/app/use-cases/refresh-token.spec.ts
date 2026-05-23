import { beforeEach, describe, expect, it } from "vitest";
import { FakeEncrypter } from "@/cryptography/fake-encrypter.ts";
import { makeRefreshToken } from "@/factories/make-refresh-token.ts";
import { InMemoryRefreshTokensRepository } from "@/repositories/in-memory-refresh-tokens-repository.ts";
import { InvalidRefreshTokenError } from "./errors/invalid-refresh-token-error.ts";
import { RefreshTokenUseCase } from "./refresh-token.ts";

describe("Refresh Token Use Case", () => {
	let refreshTokensRepository: InMemoryRefreshTokensRepository;
	let encrypter: FakeEncrypter;
	let sut: RefreshTokenUseCase;

	beforeEach(() => {
		refreshTokensRepository = new InMemoryRefreshTokensRepository();
		encrypter = new FakeEncrypter();
		sut = new RefreshTokenUseCase(refreshTokensRepository, encrypter);
	});

	it("should return error when refresh token is not found", async () => {
		const result = await sut.execute({ token: "non-existent-token" });

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidRefreshTokenError);
	});

	it("should return error when refresh token is expired", async () => {
		const expired = makeRefreshToken({
			expiresAt: new Date(Date.now() - 1000),
		});
		await refreshTokensRepository.create(expired);

		const result = await sut.execute({ token: expired.props.token });

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidRefreshTokenError);
	});

	it("should rotate refresh token and return new access token", async () => {
		const existing = makeRefreshToken({
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		});
		await refreshTokensRepository.create(existing);

		const result = await sut.execute({ token: existing.props.token });

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.accessToken).toBeDefined();
		expect(result.value.refreshToken).toBeDefined();
		expect(result.value.refreshToken).not.toBe(existing.props.token);
		expect(refreshTokensRepository.items).toHaveLength(1);
		expect(refreshTokensRepository.items[0].props.token).toBe(
			result.value.refreshToken
		);
	});
});
