import { beforeEach, describe, expect, it } from "vitest";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { makeCategory } from "@/factories/make-category.ts";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory-categories-repository.ts";
import { DisableCategoryUseCase } from "./disable-category.ts";

let categoriesRepository: InMemoryCategoriesRepository;
let sut: DisableCategoryUseCase;

describe("Disable Category Use Case", () => {
	beforeEach(() => {
		categoriesRepository = new InMemoryCategoriesRepository();
		sut = new DisableCategoryUseCase(categoriesRepository);
	});

	it("should receive error when category does not exist", async () => {
		const result = await sut.execute({
			categoryId: "not-found",
			userId: "not-found",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should diable category", async () => {
		const category = await categoriesRepository.create(
			makeCategory({ name: "Category" })
		);

		expect(category.props.isActive).toBe(true);

		const result = await sut.execute({
			categoryId: category.id.toValue(),
			userId: category.props.userId?.toValue() ?? "",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(categoriesRepository.categories[0].props.isActive).toBe(false);
	});
});
