import { beforeEach, describe, expect, it } from "vitest";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { makeTransaction } from "@/factories/make-transaction.ts";
import { InMemoryTransactionsRepository } from "@/repositories/in-memory-transactions-repository.ts";
import { DeleteTransactionUseCase } from "./delete-transaction.ts";

let transactionRepository: InMemoryTransactionsRepository;
let sut: DeleteTransactionUseCase;

describe("Delete Transaction Use Case", () => {
	beforeEach(() => {
		transactionRepository = new InMemoryTransactionsRepository();
		sut = new DeleteTransactionUseCase(transactionRepository);
	});

	it("should receive error when transaction does not exist", async () => {
		const result = await sut.execute({
			transactionId: "not-found",
			userId: "",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should delete transaction", async () => {
		const transaction = makeTransaction();
		transactionRepository.create(transaction);

		const result = await sut.execute({
			transactionId: transaction.id.toValue(),
			userId: transaction.props.userId.toValue(),
		});

		expect(result.success()).toBe(true);
		expect(transactionRepository.transactions).toHaveLength(0);
	});
});
