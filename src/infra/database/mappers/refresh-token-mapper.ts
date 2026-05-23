import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { RefreshToken } from "@/domain/accounts/enterprise/entities/refresh-token.ts";

interface RefreshTokenPersistence {
	id: string;
	userId: string;
	token: string;
	expiresAt: Date;
	createdAt: Date;
}

export class RefreshTokenMapper {
	static toDomain(raw: RefreshTokenPersistence): RefreshToken {
		return RefreshToken.create(
			{
				userId: new UniqueEntityId(raw.userId),
				token: raw.token,
				expiresAt: raw.expiresAt,
				createdAt: raw.createdAt,
			},
			new UniqueEntityId(raw.id)
		);
	}

	static toDatabase(refreshToken: RefreshToken): RefreshTokenPersistence {
		return {
			id: refreshToken.id.toValue(),
			userId: refreshToken.props.userId.toValue(),
			token: refreshToken.props.token,
			expiresAt: refreshToken.props.expiresAt,
			createdAt: refreshToken.props.createdAt,
		};
	}
}
