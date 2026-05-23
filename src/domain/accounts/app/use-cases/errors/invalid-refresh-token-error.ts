import { DomainError } from "@/core/errors/domain-error.ts";
import { DomainCode } from "@/core/errors/enums/domain-code.ts";

export class InvalidRefreshTokenError extends DomainError {
	constructor(message?: string, code?: string) {
		super(
			message ?? "Invalid or expired refresh token.",
			code ?? DomainCode.INVALID_REFRESH_TOKEN
		);
	}
}
