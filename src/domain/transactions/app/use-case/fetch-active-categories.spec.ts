import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { makeCategory } from "@/factories/make-category.ts";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory-categories-repository.ts";
import { FetchActiveCategoriesUseCase } from "./fetch-active-categories.ts";

let categoriesRepository: InMemoryCategoriesRepository;
let sut: FetchActiveCategoriesUseCase;

describe("Fetch Active Categories Use Case", () => {
	beforeEach(() => {
		categoriesRepository = new InMemoryCategoriesRepository();
		sut = new FetchActiveCategoriesUseCase(categoriesRepository);
	});

	it("should fetch active categories", async () => {
		const userId = randomUUID();

		const category = await categoriesRepository.create(
			makeCategory({
				createdAt: new Date("2022-09-01"),
				userId: new UniqueEntityId(userId),
			})
		);
		await categoriesRepository.create(
			makeCategory({
				createdAt: new Date("2025-09-02"),
				userId: new UniqueEntityId(userId),
				isActive: false,
			})
		);

		const result = await sut.execute({
			userId,
		});

		expect(result.success()).toBe(true);
		expect(result.value?.categories).toMatchObject([
			{
				id: category.id,
			},
		]);
	});

	it("should fetch active categories with name filter", async () => {
		const userId = randomUUID();

		const category = await categoriesRepository.create(
			makeCategory({
				name: "1",
				userId: new UniqueEntityId(userId),
				isActive: true,
			})
		);
		await categoriesRepository.create(
			makeCategory({
				name: "2",
				userId: new UniqueEntityId(userId),
				isActive: true,
			})
		);

		const result = await sut.execute({
			name: "1",
			userId,
		});

		expect(result.success()).toBe(true);
		expect(result.value?.categories).toMatchObject([
			{
				id: category.id,
			},
		]);
	});
});
