import { type Either, failure, success } from "@/core/either.ts";
import type { User } from "../../enterprise/entities/user.ts";
import type { Encrypter } from "../cryptography/encrypter.ts";
import type { Hasher } from "../cryptography/hasher.ts";
import type { UsersRepository } from "../repositories/users-repository.ts";
import { WrongCredentialsError } from "./errors/wrong-credentials-error.ts";

interface AuthenticateWithCredentialsUseCaseRequest {
	email: string;
	password: string;
}

type AuthenticateWithCredentialsUseCaseResponse = Either<
	WrongCredentialsError,
	{
		token: string;
		user: User;
	}
>;

export class AuthenticateWithCredentialsUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private hasher: Hasher,
		private encrypter: Encrypter
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

		const token = this.encrypter.encrypt({
			sub: user.id.toValue(),
		});

		return success({
			token,
			user,
		});
	}
}
