import type { Wallet } from "@/domain/transactions/enterprise/entities/wallet.ts";

export class WalletPresenter {
	static toHTTP(wallet: Wallet) {
		return {
			id: wallet.id.toValue(),
			user_id: wallet.props.userId.toValue(),
			name: wallet.props.name,
			description: wallet.props.description,
			created_at: wallet.props.createdAt.toISOString(),
		};
	}
}
