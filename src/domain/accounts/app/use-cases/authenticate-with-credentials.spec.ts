import { beforeEach, describe, expect, it } from "vitest";
import { FakeEncrypter } from "@/cryptography/fake-encrypter.ts";
import { FakeHasher } from "@/cryptography/fake-hasher.ts";
import { makeUser } from "@/factories/make-user.ts";
import { InMemoryRefreshTokensRepository } from "@/repositories/in-memory-refresh-tokens-repository.ts";
import { InMemoryUsersRepository } from "@/repositories/in-memory-users-repository.ts";
import { AuthenticateWithCredentialsUseCase } from "./authenticate-with-credentials.ts";
import { WrongCredentialsError } from "./errors/wrong-credentials-error.ts";

describe("Authenticate With Credentials Use Case", async () => {
	let usersRepository: InMemoryUsersRepository;
	let refreshTokensRepository: InMemoryRefreshTokensRepository;
	let hasher: FakeHasher;
	let encrypter: FakeEncrypter;
	let sut: AuthenticateWithCredentialsUseCase;

	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		refreshTokensRepository = new InMemoryRefreshTokensRepository();
		hasher = new FakeHasher();
		encrypter = new FakeEncrypter();
		sut = new AuthenticateWithCredentialsUseCase(
			usersRepository,
			hasher,
			encrypter,
			refreshTokensRepository
		);
	});

	it("should receive error when user does not exist", async () => {
		const result = await sut.execute({
			email: "not-found",
			password: "",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(WrongCredentialsError);
	});

	it("should receive error when passwords are not equals", async () => {
		const user = await usersRepository.create(
			makeUser({ passwordHash: "password-hasher" })
		);

		const result = await sut.execute({
			email: user.props.email,
			password: "password2",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(WrongCredentialsError);
	});

	it("should authenticate user and create refresh token", async () => {
		const user = await usersRepository.create(
			makeUser({ passwordHash: "password-hasher" })
		);

		const result = await sut.execute({
			email: user.props.email,
			password: "password",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.accessToken).toBeDefined();
		expect(result.value.refreshToken).toBeDefined();
		expect(result.value.refreshToken).toEqual(refreshTokensRepository.items[0].props.token);
		expect(result.value.user.id).toEqual(user.id);
		expect(refreshTokensRepository.items).toHaveLength(1);
		expect(refreshTokensRepository.items[0].props.userId).toEqual(user.id);
	});
});
