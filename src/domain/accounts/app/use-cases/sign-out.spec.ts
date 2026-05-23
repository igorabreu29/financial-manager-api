import { beforeEach, describe, expect, it } from "vitest";
import { makeRefreshToken } from "@/factories/make-refresh-token.ts";
import { InMemoryRefreshTokensRepository } from "@/repositories/in-memory-refresh-tokens-repository.ts";
import { SignOutUseCase } from "./sign-out.ts";

describe("Sign Out Use Case", () => {
	let refreshTokensRepository: InMemoryRefreshTokensRepository;
	let sut: SignOutUseCase;

	beforeEach(() => {
		refreshTokensRepository = new InMemoryRefreshTokensRepository();
		sut = new SignOutUseCase(refreshTokensRepository);
	});

	it("should delete refresh token on sign out", async () => {
		const refreshToken = makeRefreshToken();
		await refreshTokensRepository.create(refreshToken);

		await sut.execute({ token: refreshToken.props.token });

		expect(refreshTokensRepository.items).toHaveLength(0);
	});

	it("should not throw when refresh token does not exist (idempotent)", async () => {
		await expect(
			sut.execute({ token: "non-existent-token" })
		).resolves.not.toThrow();
	});
});
