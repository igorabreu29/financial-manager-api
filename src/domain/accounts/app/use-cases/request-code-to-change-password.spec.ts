import { makeUser } from "tests/factories/make-user.ts";
import { InMemoryTokensRepository } from "tests/repositories/in-memory-tokens-repository.ts";
import { InMemoryUsersRepository } from "tests/repositories/in-memory-users-repository.ts";
import { beforeEach, describe, expect, it } from "vitest";
import { FakeMailer } from "@/mail/fake-mailer.ts";
import { WrongCredentialsError } from "./errors/wrong-credentials-error.ts";
import { RequestCodeToChangePasswordUseCase } from "./request-code-to-change-password.ts";

describe("Request Code to Change Password Use Case", () => {
	let usersRepository: InMemoryUsersRepository;
	let tokensRepository: InMemoryTokensRepository;
	let mailer: FakeMailer;
	let sut: RequestCodeToChangePasswordUseCase;

	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		tokensRepository = new InMemoryTokensRepository();
		mailer = new FakeMailer();
		sut = new RequestCodeToChangePasswordUseCase(
			usersRepository,
			tokensRepository,
			mailer
		);
	});

	it("should receive error when user with email does not exist.", async () => {
		const result = await sut.execute({ email: "not-found" });

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(WrongCredentialsError);
	});

	it("should request code user", async () => {
		const user = makeUser();
		usersRepository.create(user);

		const result = await sut.execute({ email: user.props.email });

		expect(result.success()).toBe(true);

		expect(tokensRepository.items).toHaveLength(1);
		expect(mailer.emails).toHaveLength(1);
		expect(mailer.emails[0]).toMatchObject({
			to: user.props.email,
			code: tokensRepository.items[0].id.toValue(),
		});
	});
});
