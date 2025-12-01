import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { Category } from "@/domain/transactions/enterprise/entities/category.ts";
import type { InvalidCategoryError } from "@/domain/transactions/enterprise/entities/errors/invalid-category-error.ts";
import { type Either, failure, success } from "../../../../core/either.ts";
import type { CategoriesRepository } from "../repositories/categories-repository.ts";

interface ActiveCategoryUseCaseRequest {
	categoryId: string;
	userId: string;
}

type ActiveCategoryUseCaseResponse = Either<
	ResourceNotFoundError | InvalidCategoryError,
	null
>;

export class ActiveCategoryUseCase {
	constructor(private categoriesRepository: CategoriesRepository) {}

	async execute({
		categoryId,
		userId,
	}: ActiveCategoryUseCaseRequest): Promise<ActiveCategoryUseCaseResponse> {
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

		const categoryOrError = Category.create(
			{
				...categoryExists.props,
				isActive: true,
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
