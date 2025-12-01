import { DomainError } from "@/core/errors/domain-error.ts";
import { DomainCode } from "@/core/errors/enums/domain-code.ts";

export class WrongCredentialsError extends DomainError {
	constructor(message?: string, code?: string) {
		super(
			message ?? "Wrong Credentials!",
			code ?? DomainCode.RESOURCE_NOT_FOUND_ERROR
		);
	}
}
