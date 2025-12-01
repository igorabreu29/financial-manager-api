import type { AggregateRoot } from "../entities/aggregate-root.ts";
import type { UniqueEntityId } from "../entities/unique-entity-id.ts";
import type { DomainEvent } from "./domain-event.ts";

type DomainEventCallback = (event: any) => void;

export class DomainEvents {
	private static handlersMap: Record<string, DomainEventCallback[]> = {};
	private static markedAggregates: AggregateRoot<any>[] = [];

	public static shouldRun = true;

	public static markAggregateForDispatch(aggregate: AggregateRoot<any>) {
		const aggregateFound = !!DomainEvents.findMarkedAggregateByID(aggregate.id);

		if (!aggregateFound) {
			DomainEvents.markedAggregates.push(aggregate);
		}
	}

	private static dispatchAggregateEvents(aggregate: AggregateRoot<any>) {
		aggregate.domainEvents.forEach((event: DomainEvent) => {
			DomainEvents.dispatch(event);
		});
	}

	private static removeAggregateFromMarkedDispatchList(
		aggregate: AggregateRoot<any>
	) {
		const index = DomainEvents.markedAggregates.findIndex(a =>
			a.equals(aggregate)
		);

		DomainEvents.markedAggregates.splice(index, 1);
	}

	private static findMarkedAggregateByID(
		id: UniqueEntityId
	): AggregateRoot<any> | undefined {
		return DomainEvents.markedAggregates.find(aggregate => aggregate.id === id);
	}

	public static dispatchEventsForAggregate(id: UniqueEntityId) {
		const aggregate = DomainEvents.findMarkedAggregateByID(id);

		if (aggregate) {
			DomainEvents.dispatchAggregateEvents(aggregate);
			aggregate.clearEvents();
			DomainEvents.removeAggregateFromMarkedDispatchList(aggregate);
		}
	}

	public static register(
		callback: DomainEventCallback,
		eventClassName: string
	) {
		const wasEventRegisteredBefore = eventClassName in DomainEvents.handlersMap;

		if (!wasEventRegisteredBefore) {
			DomainEvents.handlersMap[eventClassName] = [];
		}

		DomainEvents.handlersMap[eventClassName].push(callback);
	}

	public static clearHandlers() {
		DomainEvents.handlersMap = {};
	}

	public static clearMarkedAggregates() {
		DomainEvents.markedAggregates = [];
	}

	private static dispatch(event: DomainEvent) {
		const eventClassName: string = event.constructor.name;

		const isEventRegistered = eventClassName in DomainEvents.handlersMap;

		if (!DomainEvents.shouldRun) {
			return;
		}

		if (isEventRegistered) {
			const handlers = DomainEvents.handlersMap[eventClassName];

			for (const handler of handlers) {
				handler(event);
			}
		}
	}
}
