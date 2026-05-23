import { randomUUID } from "node:crypto";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import {
	RefreshToken,
	type RefreshTokenProps,
} from "@/domain/accounts/enterprise/entities/refresh-token.ts";

export function makeRefreshToken(
	override: Partial<RefreshTokenProps> = {},
	id?: UniqueEntityId
): RefreshToken {
	return RefreshToken.create(
		{
			userId: new UniqueEntityId(),
			token: randomUUID(),
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			...override,
		},
		id
	);
}
