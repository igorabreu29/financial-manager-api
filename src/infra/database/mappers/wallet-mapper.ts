import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { Wallet } from "@/domain/transactions/enterprise/entities/wallet.ts";

interface WalletPersistance {
	id: string;
	name: string;
	userId: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date | null;
}

export class WalletMapper {
	static toDomain(wallet: WalletPersistance): Wallet {
		return Wallet.create(
			{
				name: wallet.name,
				userId: new UniqueEntityId(wallet.userId),
				description: wallet.description,
				createdAt: wallet.createdAt,
				updatedAt: wallet.updatedAt,
			},
			new UniqueEntityId(wallet.id)
		);
	}

	static toDatabase(wallet: Wallet): WalletPersistance {
		return {
			id: wallet.id.toValue(),
			name: wallet.props.name,
			userId: wallet.props.userId.toValue(),
			description: wallet.props.description,
			createdAt: wallet.props.createdAt,
			updatedAt: wallet.props.updatedAt,
		};
	}
}
