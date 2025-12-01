import { Entity } from "@/core/entities/entity.ts";
import type { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import type { Optional } from "@/core/types/optional.ts";

export type TokenType = "password_recover";

export interface TokenProps {
	userId: UniqueEntityId;
	type: TokenType;
	createdAt: Date;
	updatedAt: Date | null;
}

export class Token extends Entity<TokenProps> {
	static create(props: Optional<TokenProps, "createdAt">, id?: UniqueEntityId) {
		return new Token(
			{
				...props,
				createdAt: props.createdAt ?? new Date(),
			},
			id
		);
	}
}
