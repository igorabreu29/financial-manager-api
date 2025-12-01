import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import {
	Token,
	type TokenProps,
} from "@/domain/accounts/enterprise/entities/token.ts";

export function makeToken(
	override: Partial<TokenProps> = {},
	id?: UniqueEntityId
): Token {
	const token = Token.create(
		{
			userId: new UniqueEntityId(),
			type: "password_recover",
			...override,
		},
		id
	);

	return token;
}
