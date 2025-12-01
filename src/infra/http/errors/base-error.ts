import { StatusCode } from "../utils/status-code.ts";

export class BaseError extends Error {
	public readonly statusCode: StatusCode;
	public readonly code: string;

	constructor(
		message: string,
		code: string,
		statusCode: StatusCode = StatusCode.BAD_REQUEST
	) {
		super(message);

		this.code = code;
		this.statusCode = statusCode;

		Error.captureStackTrace?.(this, this.constructor);
	}
}
