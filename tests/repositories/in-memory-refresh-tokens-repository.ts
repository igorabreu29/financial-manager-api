import type { RefreshTokensRepository } from "@/domain/accounts/app/repositories/refresh-tokens-repository.ts";
import type { RefreshToken } from "@/domain/accounts/enterprise/entities/refresh-token.ts";

export class InMemoryRefreshTokensRepository
	implements RefreshTokensRepository
{
	public items: RefreshToken[] = [];

	async findByToken(token: string): Promise<RefreshToken | null> {
		return this.items.find(item => item.props.token === token) ?? null;
	}

	async create(refreshToken: RefreshToken): Promise<void> {
		this.items.push(refreshToken);
	}

	async delete(refreshToken: RefreshToken): Promise<void> {
		const index = this.items.findIndex(item => item.equals(refreshToken));
		if (index === -1) return;
		this.items.splice(index, 1);
	}

	async deleteAllByUserId(userId: string): Promise<void> {
		this.items = this.items.filter(
			item => item.props.userId.toValue() !== userId
		);
	}
}
