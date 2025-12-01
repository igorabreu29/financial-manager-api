import { CommonCode } from "../utils/common-code.ts";
import { StatusCode } from "../utils/status-code.ts";
import { BaseError } from "./base-error.ts";

export class ConflictError extends BaseError {
	constructor(message?: string, code?: string) {
		super(
			message ?? "Conflict!",
			code ?? CommonCode.CONFLICT_ERROR,
			StatusCode.CONFLICT
		);
	}
}
