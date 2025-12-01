import { beforeEach, describe, expect, it } from "vitest";
import { ResourceAlreadyExistsError } from "@/core/errors/resource-already-exists-error.ts";
import { FakeHasher } from "@/cryptography/fake-hasher.ts";
import { makeUser } from "@/factories/make-user.ts";
import { InMemoryUsersRepository } from "@/repositories/in-memory-users-repository.ts";
import { RegisterUserUseCase } from "./register-user.ts";

describe("Register User Use Case", async () => {
	let usersRepository: InMemoryUsersRepository;
	let hasher: FakeHasher;
	let sut: RegisterUserUseCase;

	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		hasher = new FakeHasher();
		sut = new RegisterUserUseCase(usersRepository, hasher);
	});

	it("should receive error when user already exists", async () => {
		const user = await usersRepository.create(makeUser());

		const result = await sut.execute({
			password: "",
			name: "",
			email: user.props.email,
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceAlreadyExistsError);
	});

	it("should register user", async () => {
		const result = await sut.execute({
			email: "john@doe.com",
			password: "password",
			name: "John Doe",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.user.props).toMatchObject({
			email: "john@doe.com",
		});
	});
});
