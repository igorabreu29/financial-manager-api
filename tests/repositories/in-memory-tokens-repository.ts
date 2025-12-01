import type { TokensRepository } from "@/domain/accounts/app/repositories/tokens-repository.ts";
import type { Token } from "@/domain/accounts/enterprise/entities/token.ts";

export class InMemoryTokensRepository implements TokensRepository {
	public items: Token[] = [];

	async findById(id: string): Promise<Token | null> {
		const token = this.items.find(item => item.id.toValue() === id);
		return token ?? null;
	}

	async create(token: Token): Promise<Token> {
		this.items.push(token);
		return token;
	}

	async delete(token: Token): Promise<void> {
		const tokenIndex = this.items.findIndex(item => item.equals(token));
		this.items.splice(tokenIndex, 1);
	}
}
