import type { CategoriesRepository } from "@/domain/transactions/app/repositories/categories-repository.ts";
import type {
	FindByCategoryAndUserIdParams,
	FindByNameAndUserIdParams,
	FindManyActiveCategoriesByUserIdParams,
	FindManyCategoriesProps,
} from "@/domain/transactions/app/repositories/types/category.ts";
import type { Category } from "@/domain/transactions/enterprise/entities/category.ts";

export class InMemoryCategoriesRepository implements CategoriesRepository {
	public categories: Category[] = [];

	public async findById(id: string): Promise<Category | null> {
		const category = this.categories.find(
			item => item.id.toValue() === id && item.props.isGlobal
		);
		return category ?? null;
	}

	public async findByName(name: string): Promise<Category | null> {
		const category = this.categories.find(item => item.props.name === name);
		return category ?? null;
	}

	public async findByCategoryAndUserId({
		categoryId,
		userId,
	}: FindByCategoryAndUserIdParams): Promise<Category | null> {
		const category = this.categories.find(
			item =>
				item.id.toValue() === categoryId &&
				item.props.userId?.toValue() === userId
		);
		return category ?? null;
	}

	public async findByNameAndUserId({
		name,
		userId,
	}: FindByNameAndUserIdParams): Promise<Category | null> {
		const category = this.categories.find(
			item =>
				item.props.name === name && item.props.userId?.toValue() === userId
		);
		return category ?? null;
	}

	public async findManyByUserId({
		userId,
		name,
		isGlobal,
	}: FindManyCategoriesProps): Promise<Category[]> {
		let categories = this.categories.filter(
			item =>
				item.props.userId?.toValue() === userId &&
				item.props.name.toLowerCase().includes(name?.toLowerCase() ?? "")
		);

		if (isGlobal !== undefined) {
			categories = categories.filter(
				category => category.props.isGlobal === isGlobal
			);
		}

		categories = categories.sort((itemA, itemB) => {
			return itemB.props.createdAt.getTime() - itemA.props.createdAt.getTime();
		});

		return categories;
	}

	public async findManyActivesByUserId({
		userId,
		name,
	}: FindManyActiveCategoriesByUserIdParams): Promise<Category[]> {
		const categories = this.categories
			.filter(
				item =>
					item.props.userId?.toValue() === userId &&
					item.props.isActive &&
					item.props.name.toLowerCase().includes(name?.toLowerCase() ?? "")
			)
			.sort((itemA, itemB) => {
				return (
					itemB.props.createdAt.getTime() - itemA.props.createdAt.getTime()
				);
			});

		return categories;
	}

	public async create(category: Category): Promise<Category> {
		this.categories.push(category);
		return category;
	}

	public async createMany(categories: Category[]): Promise<void> {
		this.categories.push(...categories);
	}

	public async save(category: Category): Promise<void> {
		const categoryIndex = this.categories.findIndex(item => {
			return item.id.equals(category.id);
		});

		this.categories[categoryIndex] = category;
	}

	public async delete(category: Category): Promise<void> {
		const categoryIndex = this.categories.findIndex(item => {
			return item.equals(category);
		});

		this.categories.splice(categoryIndex, 1);
	}
}
