import { ResourceAlreadyExistsError } from "@/core/errors/resource-already-exists-error.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { InvalidCodeError } from "@/domain/accounts/app/use-cases/errors/invalid-code-error.ts";
import { InvalidRefreshTokenError } from "@/domain/accounts/app/use-cases/errors/invalid-refresh-token-error.ts";
import { PasswordsDontMatch } from "@/domain/accounts/app/use-cases/errors/passwords-dont-match.ts";
import { WrongCredentialsError } from "@/domain/accounts/app/use-cases/errors/wrong-credentials-error.ts";
import { InvalidCategoryError } from "@/domain/transactions/enterprise/entities/errors/invalid-category-error.ts";
import { BadRequestError } from "./bad-request-error.ts";
import { ConflictError } from "./conflict-error.ts";
import { UnauthorizedError } from "./unauthorized-error.ts";

export function dispatchError(error: Error) {
	const errorClassName = error.constructor.name;

	if (
		[InvalidRefreshTokenError.name, WrongCredentialsError.name].includes(
			errorClassName
		)
	) {
		return new UnauthorizedError(error.message);
	}

	if (
		[
			ResourceNotFoundError.name,
			InvalidCategoryError.name,
			InvalidCodeError.name,
		].includes(errorClassName)
	) {
		return new BadRequestError(error.message);
	}

	if (
		[PasswordsDontMatch.name, ResourceAlreadyExistsError.name].includes(
			errorClassName
		)
	) {
		return new ConflictError(error.message);
	}

	return new Error();
}
