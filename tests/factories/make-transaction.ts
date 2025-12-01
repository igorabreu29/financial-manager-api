import { faker } from "@faker-js/faker";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import {
	Transaction,
	type TransactionProps,
} from "@/domain/transactions/enterprise/entities/transaction.ts";

export function makeTransaction(
	override: Partial<TransactionProps> = {},
	id?: UniqueEntityId
) {
	const transaction = Transaction.create(
		{
			categoryId: new UniqueEntityId(),
			userId: new UniqueEntityId(),
			description: faker.lorem.sentence(),
			price: Number(faker.finance.amount()),
			type: "income",
			...override,
		},
		id
	);

	return transaction;
}
