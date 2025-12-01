import { type Either, success } from "@/core/either.ts";
import type {
	Transaction,
	TransactionType,
} from "../../enterprise/entities/transaction.ts";
import type { TransactionsRepository } from "../repositories/transactions-repository.ts";

interface FetchTransactionsUseCaseRequest {
	userId: string;
	description?: string;
	type?: TransactionType;
	page?: number;
	perPage?: number;
}

type FetchTransactionsUseCaseResponse = Either<
	null,
	{
		transactions: Transaction[];
		totalItems: number;
		pages: number;
	}
>;

export class FetchTransactionsUseCase {
	constructor(private transactionsRepository: TransactionsRepository) {}

	async execute({
		userId,
		description,
		type,
		page = 1,
		perPage = 10,
	}: FetchTransactionsUseCaseRequest): Promise<FetchTransactionsUseCaseResponse> {
		const { pages, totalItems, transactions } =
			await this.transactionsRepository.findManyByUserId(
				{
					userId,
					query: description,
					type,
				},
				{
					page,
					perPage,
				}
			);

		return success({
			transactions,
			pages,
			totalItems,
		});
	}
}
