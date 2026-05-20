import { Entity } from "@/core/entities/entity.ts";
import type { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import type { Optional } from "@/core/types/optional.ts";

export interface WalletProps {
	name: string;
	userId: UniqueEntityId;
	description: string | null;
	createdAt: Date;
	updatedAt: Date | null;
}

export class Wallet extends Entity<WalletProps> {
	static create(
		props: Optional<WalletProps, "createdAt" | "updatedAt" | "description">,
		id?: UniqueEntityId
	): Wallet {
		return new Wallet(
			{
				...props,
				description: props.description ?? null,
				createdAt: props.createdAt ?? new Date(),
				updatedAt: props.updatedAt ?? null,
			},
			id
		);
	}
}
