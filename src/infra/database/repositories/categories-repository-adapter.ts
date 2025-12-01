import type { CategoriesRepository } from "@/domain/transactions/app/repositories/categories-repository.ts";
import type {
	FindByCategoryAndUserIdParams,
	FindByNameAndUserIdParams,
	FindManyActiveCategoriesByUserIdParams,
	FindManyCategoriesProps,
} from "@/domain/transactions/app/repositories/types/category.ts";
import type { Category } from "@/domain/transactions/enterprise/entities/category.ts";
import { CategoryMapper } from "../mappers/category-mapper.ts";
import { prisma } from "../prisma.ts";

export class CategoriesRepositoryAdapter implements CategoriesRepository {
	public async findById(id: string): Promise<Category | null> {
		const category = await prisma.category.findUnique({
			where: {
				id,
			},
		});
		if (!category) return null;

		return CategoryMapper.toDomain(category);
	}

	public async findByName(name: string): Promise<Category | null> {
		const category = await prisma.category.findFirst({
			where: {
				name,
			},
		});
		if (!category) return null;

		return CategoryMapper.toDomain(category);
	}

	public async findByCategoryAndUserId({
		categoryId,
		userId,
	}: FindByCategoryAndUserIdParams): Promise<Category | null> {
		const category = await prisma.category.findFirst({
			where: {
				id: categoryId,
				userId,
			},
		});
		if (!category) return null;

		return CategoryMapper.toDomain(category);
	}

	public async findByNameAndUserId({
		name,
		userId,
	}: FindByNameAndUserIdParams): Promise<Category | null> {
		const category = await prisma.category.findFirst({
			where: {
				name,
				userId,
			},
		});
		if (!category) return null;

		return CategoryMapper.toDomain(category);
	}

	public async findManyByUserId({
		userId,
		name,
		isGlobal,
	}: FindManyCategoriesProps): Promise<Category[]> {
		const categories = await prisma.category.findMany({
			where: {
				userId,
				isGlobal,
				name,
			},
		});

		return categories.map(CategoryMapper.toDomain);
	}

	public async findManyActivesByUserId({
		userId,
		name,
	}: FindManyActiveCategoriesByUserIdParams): Promise<Category[]> {
		const categories = await prisma.category.findMany({
			where: {
				userId,
				name,
				isActive: true,
			},
		});

		return categories.map(CategoryMapper.toDomain);
	}

	public async create(category: Category): Promise<Category> {
		const row = CategoryMapper.toDatabase(category);

		await prisma.category.create({
			data: row,
		});

		return category;
	}

	public async createMany(categories: Category[]): Promise<void> {
		const rows = categories.map(CategoryMapper.toDatabase);

		await prisma.category.createMany({
			data: rows,
		});
	}

	public async save(category: Category): Promise<void> {
		const row = CategoryMapper.toDatabase(category);

		await prisma.category.update({
			where: {
				id: row.id,
			},
			data: row,
		});
	}

	public async delete(category: Category): Promise<void> {
		await prisma.category.delete({
			where: {
				id: category.id.toValue(),
			},
		});
	}
}
