import { CommonCode } from "../utils/common-code.ts";
import { StatusCode } from "../utils/status-code.ts";
import { BaseError } from "./base-error.ts";

export class BadRequestError extends BaseError {
	constructor(message?: string, code?: string) {
		super(
			message ?? "Bad Request",
			code ?? CommonCode.BAD_REQUEST_ERROR,
			StatusCode.BAD_REQUEST
		);
	}
}
