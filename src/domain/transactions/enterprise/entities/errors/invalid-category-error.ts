import { DomainError } from "@/core/errors/domain-error.ts";
import { DomainCode } from "@/core/errors/enums/domain-code.ts";

export class InvalidCategoryError extends DomainError {
	constructor(message?: string, code?: string) {
		super(
			message ?? "Invalid Category!",
			code ?? DomainCode.INVALID_CATEGORY_ERROR
		);
	}
}
