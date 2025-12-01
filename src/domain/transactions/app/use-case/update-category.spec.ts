import { beforeEach, describe, expect, it } from "vitest";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { ResourceAlreadyExistsError } from "@/core/errors/resource-already-exists-error.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { makeCategory } from "@/factories/make-category.ts";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory-categories-repository.ts";
import { UpdateCategoryUseCase } from "./update-category.ts";

let categoriesRepository: InMemoryCategoriesRepository;
let sut: UpdateCategoryUseCase;

describe("Update Category Use Case", () => {
	beforeEach(() => {
		categoriesRepository = new InMemoryCategoriesRepository();
		sut = new UpdateCategoryUseCase(categoriesRepository);
	});

	it("should receive error when category does not exist", async () => {
		const result = await sut.execute({
			categoryId: "not-found",
			name: "Category",
			userId: "",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should receive error if user is updating category with same name", async () => {
		const userId = "user-id";

		const category = await categoriesRepository.create(
			makeCategory({ userId: new UniqueEntityId(userId) })
		);

		const category2 = await categoriesRepository.create(
			makeCategory({ userId: new UniqueEntityId(userId) })
		);

		const result = await sut.execute({
			categoryId: category.id.toValue(),
			name: category2.props.name,
			userId: category.props.userId?.toValue() ?? "",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceAlreadyExistsError);
	});

	it("should update category", async () => {
		const category = await categoriesRepository.create(
			makeCategory({ name: "Category" })
		);

		const result = await sut.execute({
			categoryId: category.id.toValue(),
			name: "Category updated",
			userId: category.props.userId?.toValue() ?? "",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(categoriesRepository.categories[0].props.name).toEqual(
			"Category updated"
		);
	});
});
