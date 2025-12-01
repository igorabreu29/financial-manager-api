import { beforeEach, describe, expect, it } from "vitest";
import { FakeHasher } from "@/cryptography/fake-hasher.ts";
import { makeToken } from "@/factories/make-token.ts";
import { makeUser } from "@/factories/make-user.ts";
import { InMemoryTokensRepository } from "@/repositories/in-memory-tokens-repository.ts";
import { InMemoryUsersRepository } from "@/repositories/in-memory-users-repository.ts";
import { InvalidCodeError } from "./errors/invalid-code-error.ts";
import { PasswordsDontMatch } from "./errors/passwords-dont-match.ts";
import { ResetPasswordUseCase } from "./reset-password.ts";

describe("Reset password Use Case", () => {
	let usersRepository: InMemoryUsersRepository;
	let tokensRepository: InMemoryTokensRepository;
	let hasher: FakeHasher;
	let sut: ResetPasswordUseCase;

	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		tokensRepository = new InMemoryTokensRepository();
		hasher = new FakeHasher();
		sut = new ResetPasswordUseCase(usersRepository, tokensRepository, hasher);
	});

	it("should receive error when token does not exist", async () => {
		const result = await sut.execute({
			code: "",
			password: "",
			confirmPassword: "",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidCodeError);
	});

	it("should receive error when passwords do not match", async () => {
		const newPassword = "123457";

		const user = makeUser();
		usersRepository.create(user);

		const token = await tokensRepository.create(makeToken({ userId: user.id }));

		const result = await sut.execute({
			code: token.id.toValue(),
			password: newPassword,
			confirmPassword: `${newPassword}8`,
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(PasswordsDontMatch);
	});

	it("should reset password", async () => {
		const previousPassword = "123456-hasher";
		const newPassword = "123457";

		const user = await usersRepository.create(
			makeUser({ passwordHash: "123456-hasher" })
		);
		const token = await tokensRepository.create(makeToken({ userId: user.id }));

		expect(usersRepository.users[0].props.passwordHash).toEqual(
			previousPassword
		);

		const result = await sut.execute({
			code: token.id.toValue(),
			password: newPassword,
			confirmPassword: newPassword,
		});

		expect(result.success()).toBe(true);
		expect(tokensRepository.items).toHaveLength(0);
		expect(usersRepository.users[0].props.passwordHash).toEqual(
			newPassword.concat("-hasher")
		);
	});
});
