import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { Category } from "@/domain/transactions/enterprise/entities/category.ts";

interface CategoryPersistance {
	id: string;
	name: string;
	userId?: string | null;
	isActive: boolean;
	isGlobal: boolean;
	createdAt: Date;
}

export class CategoryMapper {
	static toDomain(category: CategoryPersistance): Category {
		const categoryOrError = Category.create(
			{
				name: category.name,
				createdAt: category.createdAt,
				isActive: category.isActive,
				isGlobal: category.isGlobal,
				userId: category.userId
					? new UniqueEntityId(category.userId)
					: undefined,
			},
			new UniqueEntityId(category.id)
		);

		if (categoryOrError.failure()) {
			throw categoryOrError.value;
		}

		return categoryOrError.value;
	}

	static toDatabase(category: Category): CategoryPersistance {
		return {
			id: category.id.toValue(),
			createdAt: category.props.createdAt,
			isActive: category.props.isActive,
			isGlobal: category.props.isGlobal,
			name: category.props.name,
			userId: category.props.userId?.toValue(),
		};
	}
}
