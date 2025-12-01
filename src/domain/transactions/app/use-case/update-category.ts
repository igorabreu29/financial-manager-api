import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { ResourceAlreadyExistsError } from "@/core/errors/resource-already-exists-error.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { Category } from "@/domain/transactions/enterprise/entities/category.ts";
import type { InvalidCategoryError } from "@/domain/transactions/enterprise/entities/errors/invalid-category-error.ts";
import { type Either, failure, success } from "../../../../core/either.ts";
import type { CategoriesRepository } from "../repositories/categories-repository.ts";

interface UpdateCategoryUseCaseRequest {
	categoryId: string;
	name: string;
	userId: string;
}

type UpdateCategoryUseCaseResponse = Either<
	ResourceNotFoundError | ResourceAlreadyExistsError | InvalidCategoryError,
	null
>;

export class UpdateCategoryUseCase {
	constructor(private categoriesRepository: CategoriesRepository) {}

	async execute({
		categoryId,
		name,
		userId,
	}: UpdateCategoryUseCaseRequest): Promise<UpdateCategoryUseCaseResponse> {
		const categoryExists =
			await this.categoriesRepository.findByCategoryAndUserId({
				categoryId,
				userId,
			});
		if (!categoryExists) {
			return failure(
				new ResourceNotFoundError(`Category with id: ${categoryId}`)
			);
		}

		if (categoryExists.props.name !== name) {
			const categoryAlreadyExists =
				await this.categoriesRepository.findByName(name);

			if (categoryAlreadyExists) {
				if (categoryAlreadyExists.props.userId?.toValue() === userId) {
					return failure(
						new ResourceAlreadyExistsError(`Category with name ${name}`)
					);
				}
			}
		}

		const categoryOrError = Category.create(
			{
				name,
				userId: new UniqueEntityId(userId),
				createdAt: categoryExists.props.createdAt,
			},
			categoryExists.id
		);

		if (categoryOrError.failure()) {
			return failure(categoryOrError.value);
		}

		await this.categoriesRepository.save(categoryOrError.value);

		return success(null);
	}
}
