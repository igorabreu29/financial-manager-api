import { DomainError } from "@/core/errors/domain-error.ts";
import { DomainCode } from "@/core/errors/enums/domain-code.ts";

export class PasswordsDontMatch extends DomainError {
	constructor(message?: string, code?: string) {
		super(
			message ?? "Passwords don't match!",
			code ?? DomainCode.PASSWORDS_DONT_MATCH
		);
	}
}
