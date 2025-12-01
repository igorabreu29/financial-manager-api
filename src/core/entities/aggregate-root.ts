import type { DomainEvent } from "../events/domain-event.ts";
import { DomainEvents } from "../events/domain-events.ts";
import { Entity } from "./entity.ts";

export abstract class AggregateRoot<T> extends Entity<T> {
	private _domainEvents: DomainEvent[] = [];

	get domainEvents(): DomainEvent[] {
		return this._domainEvents;
	}

	protected addDomainEvent(domainEvent: DomainEvent): void {
		this._domainEvents.push(domainEvent);
		DomainEvents.markAggregateForDispatch(this);
	}

	public clearEvents(): void {
		this._domainEvents = [];
	}
}
