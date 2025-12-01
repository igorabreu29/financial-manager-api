import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { User } from "@/domain/accounts/enterprise/entities/user.ts";

interface UserPersistance {
	id: string;
	name: string;
	email: string;
	passwordHash: string;
	avatarUrl: string | null;
	createdAt: Date;
	updatedAt: Date | null;
}

export class UserMapper {
	static toDomain(user: UserPersistance): User {
		return User.create(
			{
				email: user.email,
				name: user.name,
				passwordHash: user.passwordHash,
				avatarUrl: user.avatarUrl,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
			new UniqueEntityId(user.id)
		);
	}

	static toDatabase(user: User): UserPersistance {
		return {
			id: user.id.toValue(),
			avatarUrl: user.props.avatarUrl,
			createdAt: user.props.createdAt,
			email: user.props.email,
			name: user.props.name,
			passwordHash: user.props.passwordHash,
			updatedAt: user.props.updatedAt,
		};
	}
}
