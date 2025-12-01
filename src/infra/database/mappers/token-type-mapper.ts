import type { TokenType } from "@/domain/accounts/enterprise/entities/token.ts";
import type { TokenType as PrismaTokenType } from "../generated/prisma/enums.ts";

export class TokenTypeMapper {
	static toDomain(row: PrismaTokenType): TokenType {
		const types: Record<PrismaTokenType, TokenType> = {
			PASSWORD_RECOVER: "password_recover",
		};

		return types[row];
	}

	static toDatabase(type: TokenType): PrismaTokenType {
		const types: Record<TokenType, PrismaTokenType> = {
			password_recover: "PASSWORD_RECOVER",
		};

		return types[type];
	}
}
