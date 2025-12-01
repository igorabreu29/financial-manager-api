import { DomainEvents } from "@/core/events/domain-events.ts";
import type { UsersRepository } from "@/domain/accounts/app/repositories/users-repository.ts";
import type { User } from "@/domain/accounts/enterprise/entities/user.ts";

export class InMemoryUsersRepository implements UsersRepository {
	public users: User[] = [];

	public async findById(id: string): Promise<User | null> {
		const user = this.users.find(item => item.id.toValue() === id);
		return user ?? null;
	}

	public async findByEmail(email: string): Promise<User | null> {
		const user = this.users.find(item => item.props.email === email);
		return user ?? null;
	}

	public async create(user: User): Promise<User> {
		this.users.push(user);

		DomainEvents.dispatchEventsForAggregate(user.id);

		return user;
	}

	public async save(user: User): Promise<void> {
		const userIndex = this.users.findIndex(item => {
			return item.id.equals(user.id);
		});

		this.users[userIndex] = user;
	}
}
