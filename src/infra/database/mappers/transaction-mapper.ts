import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { Transaction } from "@/domain/transactions/enterprise/entities/transaction.ts";
import type { TransactionType as PrismaTransactionType } from "../generated/prisma/enums.ts";
import { TransactionTypeMapper } from "./transaction-type-mapper.ts";

interface TransactionPersistance {
	id: string;
	description: string;
	type: PrismaTransactionType;
	price: number;
	categoryId: string;
	userId: string;
	createdAt: Date;
	updatedAt: Date | null;
}

export class TransactionMapper {
	static toDomain(transaction: TransactionPersistance): Transaction {
		return Transaction.create(
			{
				categoryId: new UniqueEntityId(transaction.categoryId),
				userId: new UniqueEntityId(transaction.userId),
				description: transaction.description,
				price: transaction.price,
				type: TransactionTypeMapper.toDomain(transaction.type),
				createdAt: transaction.createdAt,
				updatedAt: transaction.updatedAt,
			},
			new UniqueEntityId(transaction.id)
		);
	}

	static toDatabase(transaction: Transaction): TransactionPersistance {
		return {
			id: transaction.id.toValue(),
			categoryId: transaction.props.categoryId.toValue(),
			userId: transaction.props.userId.toValue(),
			description: transaction.props.description,
			price: transaction.props.price,
			type: TransactionTypeMapper.toDatabase(transaction.props.type),
			createdAt: transaction.props.createdAt,
			updatedAt: transaction.props.updatedAt,
		};
	}
}
