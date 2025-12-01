import type { Token } from "../../enterprise/entities/token.ts";

export interface TokensRepository {
	findById(id: string): Promise<Token | null>;
	create(token: Token): Promise<Token>;
	delete(token: Token): Promise<void>;
}
