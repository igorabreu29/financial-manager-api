import { faker } from "@faker-js/faker";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import {
	Wallet,
	type WalletProps,
} from "@/domain/transactions/enterprise/entities/wallet.ts";

export function makeWallet(
	override: Partial<WalletProps> = {},
	id?: UniqueEntityId
) {
	return Wallet.create(
		{
			name: faker.finance.accountName(),
			userId: new UniqueEntityId(),
			description: null,
			...override,
		},
		id
	);
}
