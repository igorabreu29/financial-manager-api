import { type Either, failure, success } from "@/core/either.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import type { CategoriesRepository } from "../repositories/categories-repository.ts";

interface DeleteCategoryUseCaseRequest {
	categoryId: string;
	userId: string;
}

type DeleteCategoryUseCaseResponse = Either<ResourceNotFoundError, null>;

export class DeleteCategoryUseCase {
	constructor(private categoriesRepository: CategoriesRepository) {}

	async execute({
		categoryId,
		userId,
	}: DeleteCategoryUseCaseRequest): Promise<DeleteCategoryUseCaseResponse> {
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

		await this.categoriesRepository.delete(categoryExists);

		return success(null);
	}
}
