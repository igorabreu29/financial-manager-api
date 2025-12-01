import type { TransactionType } from "@/domain/transactions/enterprise/entities/transaction.ts";
import type { TransactionType as PrismaTransactionType } from "../generated/prisma/enums.ts";

export class TransactionTypeMapper {
	static toDomain(row: PrismaTransactionType): TransactionType {
		const types: Record<PrismaTransactionType, TransactionType> = {
			INCOME: "income",
			OUTCOME: "outcome",
		};

		return types[row];
	}

	static toDatabase(type: TransactionType): PrismaTransactionType {
		const types: Record<TransactionType, PrismaTransactionType> = {
			income: "INCOME",
			outcome: "OUTCOME",
		};

		return types[type];
	}
}
