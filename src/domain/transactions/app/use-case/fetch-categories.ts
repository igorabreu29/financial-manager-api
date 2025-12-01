import { type Either, success } from "@/core/either.ts";
import type { Category } from "../../enterprise/entities/category.ts";
import type { CategoriesRepository } from "../repositories/categories-repository.ts";

interface FetchCategoriesUseCaseRequest {
	userId: string;
	name?: string;
}

type FetchCategoriesUseCaseResponse = Either<
	null,
	{
		categories: Category[];
	}
>;

export class FetchCategoriesUseCase {
	constructor(private categoriesRepository: CategoriesRepository) {}

	async execute({
		userId,
		name,
	}: FetchCategoriesUseCaseRequest): Promise<FetchCategoriesUseCaseResponse> {
		const categories = await this.categoriesRepository.findManyByUserId({
			userId,
			name,
		});

		return success({
			categories,
		});
	}
}
