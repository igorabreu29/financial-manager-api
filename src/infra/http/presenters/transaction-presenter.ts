import type { Transaction } from "@/domain/transactions/enterprise/entities/transaction.ts";

export class TransactionPresenter {
	static toHTTP(transaction: Transaction) {
		return {
			id: transaction.id.toValue(),
			category_id: transaction.props.categoryId.toValue(),
			user_id: transaction.props.userId.toValue(),
			description: transaction.props.description,
			price: transaction.props.price,
			type: transaction.props.type,
			created_at: transaction.props.createdAt.toISOString(),
		};
	}
}
