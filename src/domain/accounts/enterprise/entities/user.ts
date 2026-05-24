import { AggregateRoot } from "@/core/entities/aggregate-root.ts";
import type { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import type { Optional } from "@/core/types/optional.ts";
import { UserRegisteredEvent } from "../events/user-registered-event.ts";

export interface UserProps {
	name: string;
	email: string;
	passwordHash: string;
	avatarUrl: string | null;
	createdAt: Date;
	updatedAt: Date | null;
}

export class User extends AggregateRoot<UserProps> {
	static create(
		props: Optional<UserProps, "createdAt" | "avatarUrl" | "updatedAt">,
		id?: UniqueEntityId
	) {
		const user = new User(
			{
				...props,
				avatarUrl: props.avatarUrl ?? null,
				createdAt: props.createdAt ?? new Date(),
				updatedAt: props.updatedAt ?? new Date(),
			},
			id
		);

		const isNew = !id;

		if (isNew) {
			user.addDomainEvent(new UserRegisteredEvent(user));
		}

		return user;
	}

	updatePassword(password: string) {
		this.props.passwordHash = password;
	}
}
