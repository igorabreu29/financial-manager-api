import { type Either, failure, success } from "@/core/either.ts";
import { Entity } from "@/core/entities/entity.ts";
import type { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import type { Optional } from "@/core/types/optional.ts";
import { InvalidCategoryError } from "./errors/invalid-category-error.ts";

export interface CategoryProps {
	name: string;
	userId?: UniqueEntityId | null;
	isActive: boolean;
	isGlobal: boolean;
	createdAt: Date;
}

export class Category extends Entity<CategoryProps> {
	static create(
		props: Optional<CategoryProps, "createdAt" | "isGlobal" | "isActive">,
		id?: UniqueEntityId
	): Either<InvalidCategoryError, Category> {
		if (props?.userId && props?.isGlobal === true) {
			return failure(
				new InvalidCategoryError("Global category cannot belong to a user!")
			);
		}

		const category = new Category(
			{
				...props,
				userId: props.userId ?? null,
				isGlobal: props.isGlobal ?? false,
				isActive: props.isActive ?? true,
				createdAt: props.createdAt ?? new Date(),
			},
			id
		);

		return success(category);
	}
}
