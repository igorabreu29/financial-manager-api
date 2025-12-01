import type { Category } from "@/domain/transactions/enterprise/entities/category.ts";

export class CategoryPresenter {
	static toHTTP(category: Category) {
		return {
			id: category.id.toValue(),
			name: category.props.name,
			user_id: category.props.userId?.toValue(),
			is_active: category.props.isActive,
			is_global: category.props.isGlobal,
		};
	}
}
