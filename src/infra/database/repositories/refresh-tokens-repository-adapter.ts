import type { RefreshTokensRepository } from "@/domain/accounts/app/repositories/refresh-tokens-repository.ts";
import type { RefreshToken } from "@/domain/accounts/enterprise/entities/refresh-token.ts";
import { RefreshTokenMapper } from "../mappers/refresh-token-mapper.ts";
import { prisma } from "../prisma.ts";

export class RefreshTokensRepositoryAdapter implements RefreshTokensRepository {
	async findByToken(token: string): Promise<RefreshToken | null> {
		const raw = await prisma.refreshToken.findUnique({ where: { token } });
		if (!raw) return null;
		return RefreshTokenMapper.toDomain(raw);
	}

	async create(refreshToken: RefreshToken): Promise<void> {
		const data = RefreshTokenMapper.toDatabase(refreshToken);
		await prisma.refreshToken.create({ data });
	}

	async delete(refreshToken: RefreshToken): Promise<void> {
		await prisma.refreshToken.delete({
			where: { id: refreshToken.id.toValue() },
		});
	}

	async deleteAllByUserId(userId: string): Promise<void> {
		await prisma.refreshToken.deleteMany({ where: { userId } });
	}
}
