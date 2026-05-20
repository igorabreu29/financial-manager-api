import { beforeEach, describe, expect, it } from "vitest";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { makeWallet } from "@/factories/make-wallet.ts";
import { InMemoryWalletsRepository } from "@/repositories/in-memory-wallets-repository.ts";
import { DeleteWalletUseCase } from "./delete-wallet.ts";

describe("Delete Wallet Use Case", () => {
	let walletsRepository: InMemoryWalletsRepository;
	let sut: DeleteWalletUseCase;

	beforeEach(() => {
		walletsRepository = new InMemoryWalletsRepository();
		sut = new DeleteWalletUseCase(walletsRepository);
	});

	it("should return error when wallet does not exist", async () => {
		const result = await sut.execute({
			walletId: "non-existent",
			userId: "user-1",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should return error when wallet belongs to a different user", async () => {
		const wallet = await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId("user-1") })
		);

		const result = await sut.execute({
			walletId: wallet.id.toValue(),
			userId: "user-2",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should delete the wallet", async () => {
		const wallet = await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId("user-1") })
		);

		const result = await sut.execute({
			walletId: wallet.id.toValue(),
			userId: "user-1",
		});

		expect(result.success()).toBe(true);
		expect(walletsRepository.wallets).toHaveLength(0);
	});
});
