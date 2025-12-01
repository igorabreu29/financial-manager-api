import { beforeEach, describe, expect, it } from "vitest";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { makeCategory } from "@/factories/make-category.ts";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory-categories-repository.ts";
import { DeleteCategoryUseCase } from "./delete-category.ts";

let categoriesRepository: InMemoryCategoriesRepository;
let sut: DeleteCategoryUseCase;

describe("Delete Category Use Case", () => {
	beforeEach(() => {
		categoriesRepository = new InMemoryCategoriesRepository();
		sut = new DeleteCategoryUseCase(categoriesRepository);
	});

	it("should receive error when category does not exist", async () => {
		const result = await sut.execute({
			categoryId: "not-found",
			userId: "",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should delete category", async () => {
		const category = await categoriesRepository.create(makeCategory());

		const result = await sut.execute({
			categoryId: category.id.toValue(),
			userId: category.props.userId?.toValue() ?? "",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(categoriesRepository.categories).toHaveLength(0);
	});
});
