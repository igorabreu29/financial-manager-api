import { Entity } from "@/core/entities/entity.ts";
import type { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import type { Optional } from "@/core/types/optional.ts";

export type TransactionType = "income" | "outcome";

export interface TransactionProps {
	description: string;
	type: TransactionType;
	price: number;
	categoryId: UniqueEntityId;
	userId: UniqueEntityId;
	createdAt: Date;
	updatedAt: Date | null;
}

export class Transaction extends Entity<TransactionProps> {
	static create(
		props: Optional<TransactionProps, "createdAt" | "updatedAt">,
		id?: UniqueEntityId
	) {
		return new Transaction(
			{
				...props,
				createdAt: props.createdAt ?? new Date(),
				updatedAt: props.updatedAt ?? new Date(),
			},
			id
		);
	}
}
