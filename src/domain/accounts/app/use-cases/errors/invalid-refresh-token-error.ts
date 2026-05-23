import { DomainError } from "@/core/errors/domain-error.ts";
import { DomainCode } from "@/core/errors/enums/domain-code.ts";

export class InvalidRefreshTokenError extends DomainError {
	constructor() {
		super("Invalid or expired refresh token.", DomainCode.INVALID_REFRESH_TOKEN);
	}
}
