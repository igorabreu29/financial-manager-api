import { DomainError } from "@/core/errors/domain-error.ts";
import { DomainCode } from "@/core/errors/enums/domain-code.ts";

export class InvalidCodeError extends DomainError {
	constructor(message?: string, code?: string) {
		super(
			message ?? "Invalid code!",
			code ?? DomainCode.INVALID_CATEGORY_ERROR
		);
	}
}
