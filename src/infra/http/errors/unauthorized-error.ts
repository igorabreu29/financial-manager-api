import { CommonCode } from "../utils/common-code.ts";
import { StatusCode } from "../utils/status-code.ts";
import { BaseError } from "./base-error.ts";

export class UnauthorizedError extends BaseError {
	constructor(message?: string, code?: string) {
		super(
			message ?? "Unauthorized",
			code ?? CommonCode.UNAUTHORIZED_ERROR,
			StatusCode.UNAUTHORIZED
		);
	}
}
