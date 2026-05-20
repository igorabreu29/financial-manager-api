import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { makeWallet } from "@/factories/make-wallet.ts";
import { InMemoryWalletsRepository } from "@/repositories/in-memory-wallets-repository.ts";
import { FetchWalletsUseCase } from "./fetch-wallets.ts";

describe("Fetch Wallets Use Case", () => {
	let walletsRepository: InMemoryWalletsRepository;
	let sut: FetchWalletsUseCase;

	beforeEach(() => {
		walletsRepository = new InMemoryWalletsRepository();
		sut = new FetchWalletsUseCase(walletsRepository);
	});

	it("should return empty list when user has no wallets", async () => {
		const result = await sut.execute({ userId: "user-1", page: 1, perPage: 10 });

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.wallets).toHaveLength(0);
		expect(result.value.totalItems).toBe(0);
	});

	it("should return paginated wallets for user", async () => {
		const userId = randomUUID();

		await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId(userId), createdAt: new Date("2024-01-01") })
		);
		await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId(userId), createdAt: new Date("2024-02-01") })
		);
		await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId(userId), createdAt: new Date("2024-03-01") })
		);

		const result = await sut.execute({ userId, page: 1, perPage: 2 });

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.wallets).toHaveLength(2);
		expect(result.value.totalItems).toBe(3);
		expect(result.value.pages).toBe(2);
	});

	it("should not return wallets from other users", async () => {
		await walletsRepository.create(makeWallet({ userId: new UniqueEntityId("other-user") }));

		const result = await sut.execute({ userId: "user-1", page: 1, perPage: 10 });

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.wallets).toHaveLength(0);
	});
});
