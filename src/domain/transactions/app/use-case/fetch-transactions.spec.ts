import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { makeTransaction } from "@/factories/make-transaction.ts";
import { InMemoryTransactionsRepository } from "@/repositories/in-memory-transactions-repository.ts";
import { FetchTransactionsUseCase } from "./fetch-transactions.ts";

let transactionRepository: InMemoryTransactionsRepository;
let sut: FetchTransactionsUseCase;

describe("Fetch Transactions Use Case", () => {
	beforeEach(() => {
		transactionRepository = new InMemoryTransactionsRepository();
		sut = new FetchTransactionsUseCase(transactionRepository);
	});

	it("should fetch transactions", async () => {
		const userId = randomUUID();

		const transaction = await transactionRepository.create(
			makeTransaction({
				createdAt: new Date("2022-09-01"),
				userId: new UniqueEntityId(userId),
			})
		);
		const transaction2 = await transactionRepository.create(
			makeTransaction({
				createdAt: new Date("2025-09-02"),
				userId: new UniqueEntityId(userId),
			})
		);

		const result = await sut.execute({
			userId,
		});

		expect(result.success()).toBe(true);
		expect(result.value?.transactions).toMatchObject([
			{
				id: transaction2.id,
			},
			{
				id: transaction.id,
			},
		]);
	});

	it("should fetch transactions with description filter", async () => {
		const userId = randomUUID();

		const transaction = await transactionRepository.create(
			makeTransaction({ description: "1", userId: new UniqueEntityId(userId) })
		);
		await transactionRepository.create(
			makeTransaction({ description: "2", userId: new UniqueEntityId(userId) })
		);

		const result = await sut.execute({
			userId,
			description: "1",
		});

		expect(result.success()).toBe(true);
		expect(result.value?.transactions).toMatchObject([
			{
				id: transaction.id,
			},
		]);
	});

	it("should fetch transactions with type filter", async () => {
		const userId = randomUUID();

		const transaction = await transactionRepository.create(
			makeTransaction({ type: "income", userId: new UniqueEntityId(userId) })
		);
		await transactionRepository.create(
			makeTransaction({ type: "outcome", userId: new UniqueEntityId(userId) })
		);

		const result = await sut.execute({
			type: "income",
			userId,
		});

		expect(result.success()).toBe(true);
		expect(result.value?.transactions).toMatchObject([
			{
				id: transaction.id,
			},
		]);
	});

	it("should fetch transactions with filters", async () => {
		const userId = randomUUID();

		await transactionRepository.create(
			makeTransaction({
				type: "income",
				description: "2",
				userId: new UniqueEntityId(userId),
			})
		);
		await transactionRepository.create(
			makeTransaction({
				type: "outcome",
				description: "1",
				userId: new UniqueEntityId(userId),
			})
		);
		const transaction3 = await transactionRepository.create(
			makeTransaction({
				type: "income",
				description: "1",
				userId: new UniqueEntityId(userId),
			})
		);

		const result = await sut.execute({
			type: "income",
			description: "1",
			userId,
		});

		expect(result.success()).toBe(true);
		expect(result.value?.transactions).toMatchObject([
			{
				id: transaction3.id,
			},
		]);
	});

	it("should fetch paginated transactions", async () => {
		const userId = randomUUID();

		for (let i = 1; i <= 8; i++) {
			transactionRepository.create(
				makeTransaction(
					{
						createdAt: new Date(`2025-09-0${i}`),
						userId: new UniqueEntityId(userId),
					},
					new UniqueEntityId(`id-${i}`)
				)
			);
		}

		const result = await sut.execute({
			page: 2,
			perPage: 6,
			userId,
		});

		expect(result.success()).toBe(true);
		expect(result.value?.transactions).toMatchObject([
			{
				id: new UniqueEntityId("id-2"),
			},
			{
				id: new UniqueEntityId("id-1"),
			},
		]);
	});
});
