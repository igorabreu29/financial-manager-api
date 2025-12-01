import { beforeEach, describe, expect, it } from "vitest";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { ResourceAlreadyExistsError } from "@/core/errors/resource-already-exists-error.ts";
import { makeCategory } from "@/factories/make-category.ts";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory-categories-repository.ts";
import { CreateCategoryUseCase } from "./create-category.ts";

let categoriesRepository: InMemoryCategoriesRepository;
let sut: CreateCategoryUseCase;

describe("Create Category Use Case", () => {
	beforeEach(() => {
		categoriesRepository = new InMemoryCategoriesRepository();
		sut = new CreateCategoryUseCase(categoriesRepository);
	});

	it("should receive error if user already created another category with same name", async () => {
		const userId = "user-id";

		const category = await categoriesRepository.create(
			makeCategory({ userId: new UniqueEntityId(userId) })
		);

		const result = await sut.execute({
			name: category.props.name,
			userId,
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceAlreadyExistsError);
	});

	it("should create new category", async () => {
		const result = await sut.execute({
			name: "New Category",
			userId: "",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.category.id).toBeDefined();
	});
});
