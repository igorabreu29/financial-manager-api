import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryWalletsRepository } from "@/repositories/in-memory-wallets-repository.ts";
import { CreateWalletUseCase } from "./create-wallet.ts";

describe("Create Wallet Use Case", () => {
	let walletsRepository: InMemoryWalletsRepository;
	let sut: CreateWalletUseCase;

	beforeEach(() => {
		walletsRepository = new InMemoryWalletsRepository();
		sut = new CreateWalletUseCase(walletsRepository);
	});

	it("should create a wallet", async () => {
		const result = await sut.execute({
			name: "My Wallet",
			description: "Personal finances",
			userId: "user-1",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.wallet.props.name).toBe("My Wallet");
		expect(result.value.wallet.props.description).toBe("Personal finances");
		expect(walletsRepository.wallets).toHaveLength(1);
	});

	it("should create a wallet without description", async () => {
		const result = await sut.execute({
			name: "My Wallet",
			userId: "user-1",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.wallet.props.description).toBeNull();
	});
});
