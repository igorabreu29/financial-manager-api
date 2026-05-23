import type { RefreshTokensRepository } from "../repositories/refresh-tokens-repository.ts";

interface SignOutUseCaseRequest {
	token: string;
}

export class SignOutUseCase {
	constructor(private refreshTokensRepository: RefreshTokensRepository) {}

	public async execute({ token }: SignOutUseCaseRequest): Promise<void> {
		const refreshToken = await this.refreshTokensRepository.findByToken(token);
		if (!refreshToken) return;
		await this.refreshTokensRepository.delete(refreshToken);
	}
}
