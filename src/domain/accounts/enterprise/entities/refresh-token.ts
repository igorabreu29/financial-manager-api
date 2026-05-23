import { Entity } from "@/core/entities/entity.ts";
import type { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import type { Optional } from "@/core/types/optional.ts";

export interface RefreshTokenProps {
	userId: UniqueEntityId;
	token: string;
	expiresAt: Date;
	createdAt: Date;
}

export class RefreshToken extends Entity<RefreshTokenProps> {
	static create(
		props: Optional<RefreshTokenProps, "createdAt">,
		id?: UniqueEntityId
	) {
		return new RefreshToken(
			{
				...props,
				createdAt: props.createdAt ?? new Date(),
			},
			id
		);
	}
}
