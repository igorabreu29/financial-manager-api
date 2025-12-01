import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { Category } from "@/domain/transactions/enterprise/entities/category.ts";
import type { InvalidCategoryError } from "@/domain/transactions/enterprise/entities/errors/invalid-category-error.ts";
import { type Either, failure, success } from "../../../../core/either.ts";
import { ResourceAlreadyExistsError } from "../../../../core/errors/resource-already-exists-error.ts";
import type { CategoriesRepository } from "../repositories/categories-repository.ts";

interface CreateCategoryUseCaseRequest {
	name: string;
	userId: string;
}

type CreateCategoryUseCaseResponse = Either<
	ResourceAlreadyExistsError | InvalidCategoryError,
	{
		category: Category;
	}
>;

export class CreateCategoryUseCase {
	constructor(private categoriesRepository: CategoriesRepository) {}

	async execute({
		name,
		userId,
	}: CreateCategoryUseCaseRequest): Promise<CreateCategoryUseCaseResponse> {
		const categoryAlreadyExists =
			await this.categoriesRepository.findByName(name);

		if (categoryAlreadyExists) {
			if (categoryAlreadyExists.props.userId?.toValue() === userId) {
				return failure(
					new ResourceAlreadyExistsError(`Category with name ${name}`)
				);
			}
		}

		const categoryOrError = Category.create({
			name,
			userId: new UniqueEntityId(userId),
		});

		if (categoryOrError.failure()) {
			return failure(categoryOrError.value);
		}

		await this.categoriesRepository.create(categoryOrError.value);

		return success({
			category: categoryOrError.value,
		});
	}
}
