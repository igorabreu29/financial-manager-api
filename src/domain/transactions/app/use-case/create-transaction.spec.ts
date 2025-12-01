import { beforeEach, describe, expect, it } from "vitest";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { makeCategory } from "@/factories/make-category.ts";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory-categories-repository.ts";
import { InMemoryTransactionsRepository } from "@/repositories/in-memory-transactions-repository.ts";
import { CreateTransactionUseCase } from "./create-transaction.ts";

describe("Create Transaction Use Case", () => {
	let transactionsRepository: InMemoryTransactionsRepository;
	let categoriesRepository: InMemoryCategoriesRepository;
	let sut: CreateTransactionUseCase;

	beforeEach(() => {
		transactionsRepository = new InMemoryTransactionsRepository();
		categoriesRepository = new InMemoryCategoriesRepository();
		sut = new CreateTransactionUseCase(
			transactionsRepository,
			categoriesRepository
		);
	});

	it("should receive error when category does not exist", async () => {
		const result = await sut.execute({
			description: "test-description",
			categoryId: "category-1",
			userId: "",
			price: 100,
			type: "income",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should be able to create a transaction", async () => {
		const category = await categoriesRepository.create(makeCategory());

		const result = await sut.execute({
			description: "test-description",
			categoryId: category.id.toValue(),
			userId: category.props.userId?.toValue() ?? "",
			price: 100,
			type: "income",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.transaction.props).toMatchObject({
			description: "test-description",
		});
	});
});
