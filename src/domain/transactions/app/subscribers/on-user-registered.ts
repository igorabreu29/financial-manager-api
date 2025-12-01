import { DomainEvents } from "@/core/events/domain-events.ts";
import type { EventHandler } from "@/core/events/event-handler.ts";
import { UserRegisteredEvent } from "@/domain/accounts/enterprise/events/user-registered-event.ts";
import { Category } from "../../enterprise/entities/category.ts";
import { InvalidCategoryError } from "../../enterprise/entities/errors/invalid-category-error.ts";
import type { CategoriesRepository } from "../repositories/categories-repository.ts";
import { getGlobalCategories } from "../utils/get-global-categories.ts";

export class OnUserRegistered implements EventHandler {
	constructor(private categoriesRepository: CategoriesRepository) {
		this.setupSubscriptions();
	}

	setupSubscriptions(): void {
		DomainEvents.register(
			this.dispatchEmail.bind(this),
			UserRegisteredEvent.name
		);
	}

	public async dispatchEmail({ user }: UserRegisteredEvent) {
		const globalCategories = getGlobalCategories();

		const categories = globalCategories.map(globalCategory => {
			const category = Category.create({
				name: globalCategory.name,
				isActive: true,
				userId: user.id,
			});

			if (category.failure()) throw new InvalidCategoryError();

			return category.value;
		});

		await this.categoriesRepository.createMany(categories);
	}
}
