import { Entity } from "@/core/entities/entity.ts";
import type { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import type { Optional } from "@/core/types/optional.ts";

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
