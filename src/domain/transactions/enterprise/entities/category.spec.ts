import { describe, expect, it } from "vitest";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { Category } from "./category.ts";
import { InvalidCategoryError } from "./errors/invalid-category-error.ts";

describe("Category entity", () => {
	it("should receive error when trying create a category with userId and isGlobal", () => {
		const category = Category.create({
			userId: new UniqueEntityId("user-1"),
			isGlobal: true,
			name: "Category",
		});

		expect(category.failure()).toBe(true);
		expect(category.value).toBeInstanceOf(InvalidCategoryError);
	});

	it("should create category with a dynamic id", () => {
		const category = Category.create({
			name: "Category",
		});

		expect(category.success()).toBe(true);

		if (category.failure()) return;

		expect(category.value.id).toBeDefined();
		expect(category.value.props).toMatchObject({
			name: "Category",
		});
	});

	it("should create category with id", () => {
		const category = Category.create(
			{
				name: "Category",
			},
			new UniqueEntityId("id")
		);

		expect(category.success()).toBe(true);

		if (category.failure()) return;

		expect(category.value.id.toValue()).toEqual("id");
		expect(category.value.props).toMatchObject({
			name: "Category",
		});
	});
});
