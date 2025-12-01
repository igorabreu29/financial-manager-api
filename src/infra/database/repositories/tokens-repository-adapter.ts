import type { TokensRepository } from "@/domain/accounts/app/repositories/tokens-repository.ts";
import type { Token } from "@/domain/accounts/enterprise/entities/token.ts";
import { TokenMapper } from "../mappers/token-mapper.ts";
import { prisma } from "../prisma.ts";

export class TokensRepositoryAdapter implements TokensRepository {
	public async findById(id: string): Promise<Token | null> {
		const token = await prisma.token.findUnique({
			where: {
				id,
			},
		});

		if (!token) return null;

		return TokenMapper.toDomain(token);
	}

	public async create(token: Token): Promise<Token> {
		const row = TokenMapper.toDatabase(token);

		await prisma.token.create({
			data: row,
		});

		return token;
	}

	public async delete(token: Token): Promise<void> {
		await prisma.token.delete({
			where: {
				id: token.id.toValue(),
			},
		});
	}
}
