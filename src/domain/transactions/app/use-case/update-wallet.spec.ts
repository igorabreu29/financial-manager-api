import { beforeEach, describe, expect, it } from "vitest";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { makeWallet } from "@/factories/make-wallet.ts";
import { InMemoryWalletsRepository } from "@/repositories/in-memory-wallets-repository.ts";
import { UpdateWalletUseCase } from "./update-wallet.ts";

describe("Update Wallet Use Case", () => {
	let walletsRepository: InMemoryWalletsRepository;
	let sut: UpdateWalletUseCase;

	beforeEach(() => {
		walletsRepository = new InMemoryWalletsRepository();
		sut = new UpdateWalletUseCase(walletsRepository);
	});

	it("should return error when wallet does not exist", async () => {
		const result = await sut.execute({
			walletId: "non-existent",
			userId: "user-1",
			name: "Updated",
			description: null,
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
			name: "Updated",
			description: null,
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should update wallet name and description", async () => {
		const wallet = await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId("user-1") })
		);

		const result = await sut.execute({
			walletId: wallet.id.toValue(),
			userId: "user-1",
			name: "Updated Name",
			description: "Updated desc",
		});

		expect(result.success()).toBe(true);
		expect(walletsRepository.wallets[0].props.name).toBe("Updated Name");
		expect(walletsRepository.wallets[0].props.description).toBe("Updated desc");
	});

	it("should allow clearing description to null", async () => {
		const wallet = await walletsRepository.create(
			makeWallet({
				userId: new UniqueEntityId("user-1"),
				description: "old desc",
			})
		);

		const result = await sut.execute({
			walletId: wallet.id.toValue(),
			userId: "user-1",
			name: "My Wallet",
			description: null,
		});

		expect(result.success()).toBe(true);
		expect(walletsRepository.wallets[0].props.description).toBeNull();
	});
});
