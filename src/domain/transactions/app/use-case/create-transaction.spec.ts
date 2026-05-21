import { beforeEach, describe, expect, it } from "vitest";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { makeCategory } from "@/factories/make-category.ts";
import { makeWallet } from "@/factories/make-wallet.ts";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory-categories-repository.ts";
import { InMemoryTransactionsRepository } from "@/repositories/in-memory-transactions-repository.ts";
import { InMemoryWalletsRepository } from "@/repositories/in-memory-wallets-repository.ts";
import { CreateTransactionUseCase } from "./create-transaction.ts";

describe("Create Transaction Use Case", () => {
	let transactionsRepository: InMemoryTransactionsRepository;
	let categoriesRepository: InMemoryCategoriesRepository;
	let walletsRepository: InMemoryWalletsRepository;
	let sut: CreateTransactionUseCase;

	beforeEach(() => {
		transactionsRepository = new InMemoryTransactionsRepository();
		categoriesRepository = new InMemoryCategoriesRepository();
		walletsRepository = new InMemoryWalletsRepository();
		sut = new CreateTransactionUseCase(
			transactionsRepository,
			categoriesRepository,
			walletsRepository
		);
	});

	it("should receive error when category does not exist", async () => {
		const wallet = await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId("user-1") })
		);

		const result = await sut.execute({
			description: "test-description",
			categoryId: "category-1",
			walletId: wallet.id.toValue(),
			userId: "user-1",
			price: 100,
			type: "income",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should receive error when wallet does not exist", async () => {
		const category = await categoriesRepository.create(makeCategory());

		const result = await sut.execute({
			description: "test-description",
			categoryId: category.id.toValue(),
			walletId: "non-existent-wallet",
			userId: category.props.userId?.toValue() ?? "",
			price: 100,
			type: "income",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should be able to create a transaction", async () => {
		const userId = "user-1";

		const category = await categoriesRepository.create(
			makeCategory({ userId: new UniqueEntityId(userId) })
		);
		const wallet = await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId(userId) })
		);

		const result = await sut.execute({
			description: "test-description",
			categoryId: category.id.toValue(),
			walletId: wallet.id.toValue(),
			userId,
			price: 100,
			type: "income",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.transaction.props).toMatchObject({
			description: "test-description",
		});
		expect(result.value.transaction.props.walletId.toValue()).toBe(
			wallet.id.toValue()
		);
	});
});
