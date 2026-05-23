import type { RefreshToken } from "../../enterprise/entities/refresh-token.ts";

export interface RefreshTokensRepository {
	findByToken(token: string): Promise<RefreshToken | null>;
	create(refreshToken: RefreshToken): Promise<void>;
	delete(refreshToken: RefreshToken): Promise<void>;
	deleteAllByUserId(userId: string): Promise<void>;
}
