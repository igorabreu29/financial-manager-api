import { DomainError } from "@/core/errors/domain-error.ts";
import { DomainCode } from "@/core/errors/enums/domain-code.ts";

export class DuplicateGlobalCategoryError extends DomainError {
	constructor(message?: string, code?: string) {
		super(
			message ?? "It is not possible to duplicate global categories!",
			code ?? DomainCode.DUPLICATE_GLOBAL_CATEGORY
		);
	}
}
