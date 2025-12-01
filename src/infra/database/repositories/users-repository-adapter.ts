import { DomainEvents } from "@/core/events/domain-events.ts";
import type { UsersRepository } from "@/domain/accounts/app/repositories/users-repository.ts";
import type { User } from "@/domain/accounts/enterprise/entities/user.ts";
import { UserMapper } from "../mappers/user-mapper.ts";
import { prisma } from "../prisma.ts";

export class UsersRepositoryAdapter implements UsersRepository {
	public async findById(id: string): Promise<User | null> {
		const user = await prisma.user.findUnique({
			where: {
				id,
			},
		});

		if (!user) return null;

		return UserMapper.toDomain(user);
	}

	public async findByEmail(email: string): Promise<User | null> {
		const user = await prisma.user.findFirst({
			where: {
				email,
			},
		});

		if (!user) return null;

		return UserMapper.toDomain(user);
	}

	public async create(user: User): Promise<User> {
		const row = UserMapper.toDatabase(user);

		await prisma.user.create({
			data: row,
		});

		DomainEvents.dispatchEventsForAggregate(user.id);

		return user;
	}

	public async save(user: User): Promise<void> {
		const row = UserMapper.toDatabase(user);

		await prisma.user.update({
			where: {
				id: row.id,
			},
			data: row,
		});
	}
}
