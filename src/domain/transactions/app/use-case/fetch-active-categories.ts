import { type Either, success } from "@/core/either.ts";
import type { Category } from "../../enterprise/entities/category.ts";
import type { CategoriesRepository } from "../repositories/categories-repository.ts";

interface FetchActiveCategoriesUseCaseRequest {
	userId: string;
	name?: string;
}

type FetchActiveCategoriesUseCaseResponse = Either<
	null,
	{
		categories: Category[];
	}
>;

export class FetchActiveCategoriesUseCase {
	constructor(private categoriesRepository: CategoriesRepository) {}

	async execute({
		userId,
		name,
	}: FetchActiveCategoriesUseCaseRequest): Promise<FetchActiveCategoriesUseCaseResponse> {
		const categories = await this.categoriesRepository.findManyActivesByUserId({
			userId,
			name,
		});

		return success({
			categories,
		});
	}
}
