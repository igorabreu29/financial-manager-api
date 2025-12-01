import { beforeEach, describe, expect, it } from "vitest";
import { FakeEncrypter } from "@/cryptography/fake-encrypter.ts";
import { FakeHasher } from "@/cryptography/fake-hasher.ts";
import { makeUser } from "@/factories/make-user.ts";
import { InMemoryUsersRepository } from "@/repositories/in-memory-users-repository.ts";
import { AuthenticateWithCredentialsUseCase } from "./authenticate-with-credentials.ts";
import { WrongCredentialsError } from "./errors/wrong-credentials-error.ts";

describe("Authenticate With Credentials Use Case", async () => {
	let usersRepository: InMemoryUsersRepository;
	let hasher: FakeHasher;
	let encrypter: FakeEncrypter;
	let sut: AuthenticateWithCredentialsUseCase;

	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		hasher = new FakeHasher();
		encrypter = new FakeEncrypter();
		sut = new AuthenticateWithCredentialsUseCase(
			usersRepository,
			hasher,
			encrypter
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
			makeUser({
				passwordHash: "password-hasher",
			})
		);

		const result = await sut.execute({
			email: user.props.email,
			password: "password2",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(WrongCredentialsError);
	});

	it("should authenticate user", async () => {
		const user = await usersRepository.create(
			makeUser({
				passwordHash: "password-hasher",
			})
		);

		const result = await sut.execute({
			email: user.props.email,
			password: "password",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.token).toBeDefined();
		expect(result.value.user).toMatchObject({
			id: user.id,
		});
	});
});
