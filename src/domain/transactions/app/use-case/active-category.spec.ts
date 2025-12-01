import { beforeEach, describe, expect, it } from "vitest";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { makeCategory } from "@/factories/make-category.ts";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory-categories-repository.ts";
import { ActiveCategoryUseCase } from "./active-category.ts";

let categoriesRepository: InMemoryCategoriesRepository;
let sut: ActiveCategoryUseCase;

describe("Active Category Use Case", () => {
	beforeEach(() => {
		categoriesRepository = new InMemoryCategoriesRepository();
		sut = new ActiveCategoryUseCase(categoriesRepository);
	});

	it("should receive error when category does not exist", async () => {
		const result = await sut.execute({
			categoryId: "not-found",
			userId: "not-found",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should active category", async () => {
		const category = await categoriesRepository.create(
			makeCategory({ name: "Category", isActive: false })
		);

		expect(category.props.isActive).toBe(false);

		const result = await sut.execute({
			categoryId: category.id.toValue(),
			userId: category.props.userId?.toValue() ?? "",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(categoriesRepository.categories[0].props.isActive).toBe(true);
	});
});
