import { faker } from "@faker-js/faker";
import type { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import {
	User,
	type UserProps,
} from "@/domain/accounts/enterprise/entities/user.ts";

export function makeUser(
	override: Partial<UserProps> = {},
	id?: UniqueEntityId
) {
	const user = User.create(
		{
			email: faker.internet.email(),
			passwordHash: "Password@123",
			name: faker.company.name(),
			...override,
		},
		id
	);

	return user;
}
