import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { Token } from "@/domain/accounts/enterprise/entities/token.ts";
import type { TokenType as PrismaTokenType } from "../generated/prisma/enums.ts";
import { TokenTypeMapper } from "./token-type-mapper.ts";

interface TokenPersistance {
	id: string;
	userId: string;
	type: PrismaTokenType;
	createdAt: Date;
	updatedAt: Date | null;
}

export class TokenMapper {
	static toDomain(token: TokenPersistance): Token {
		return Token.create(
			{
				createdAt: token.createdAt,
				type: TokenTypeMapper.toDomain(token.type),
				userId: new UniqueEntityId(token.userId),
				updatedAt: token.updatedAt,
			},
			new UniqueEntityId(token.id)
		);
	}

	static toDatabase(token: Token): TokenPersistance {
		return {
			id: token.id.toValue(),
			createdAt: token.props.createdAt,
			updatedAt: token.props.updatedAt,
			type: TokenTypeMapper.toDatabase(token.props.type),
			userId: token.props.userId.toValue(),
		};
	}
}
