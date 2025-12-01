import type { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import type { DomainEvent } from "@/core/events/domain-event.ts";
import type { User } from "../entities/user.ts";

export class UserRegisteredEvent implements DomainEvent {
	public ocurredAt: Date;
	public user: User;

	constructor(user: User) {
		this.user = user;
		this.ocurredAt = new Date();
	}

	public getAggregateId(): UniqueEntityId {
		return this.user.id;
	}
}
