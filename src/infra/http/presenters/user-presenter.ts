import type { User } from "@/domain/accounts/enterprise/entities/user.ts";

export class UserPresenter {
	static toHTTP(user: User) {
		return {
			id: user.id.toValue(),
			name: user.props.name,
			email: user.props.email,
			avatar_url: user.props.avatarUrl,
			created_at: user.props.createdAt.toISOString(),
		};
	}
}
