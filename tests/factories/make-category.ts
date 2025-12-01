import { faker } from "@faker-js/faker";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import {
	Category,
	type CategoryProps,
} from "@/domain/transactions/enterprise/entities/category.ts";
import { InvalidCategoryError } from "@/domain/transactions/enterprise/entities/errors/invalid-category-error.ts";

export function makeCategory(
	override: Partial<CategoryProps> = {},
	id?: UniqueEntityId
) {
	const category = Category.create(
		{
			userId: new UniqueEntityId(),
			name: faker.company.name(),
			...override,
		},
		id
	);

	if (category.failure()) throw new InvalidCategoryError();

	return category.value;
}
