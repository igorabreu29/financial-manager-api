import { type Either, failure, success } from "@/core/either.ts";
import { ResourceAlreadyExistsError } from "@/core/errors/resource-already-exists-error.ts";
import { User } from "../../enterprise/entities/user.ts";
import type { Hasher } from "../cryptography/hasher.ts";
import type { UsersRepository } from "../repositories/users-repository.ts";

interface RegisterUserUseCaseRequest {
	name: string;
	email: string;
	password: string;
}

type RegisterUserUseCaseResponse = Either<
	ResourceAlreadyExistsError,
	{
		user: User;
	}
>;

export class RegisterUserUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private hasher: Hasher
	) {}

	public async execute({
		email,
		password,
		name,
	}: RegisterUserUseCaseRequest): Promise<RegisterUserUseCaseResponse> {
		const userAlreadyExists = await this.usersRepository.findByEmail(email);
		if (userAlreadyExists)
			return failure(new ResourceAlreadyExistsError(`User with ${email}`));

		const passwordHash = await this.hasher.hash(password);

		const user = User.create({
			email,
			name,
			passwordHash,
		});

		await this.usersRepository.create(user);

		return success({
			user,
		});
	}
}
