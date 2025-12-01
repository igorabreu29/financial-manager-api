export abstract class DomainError extends Error {
	public readonly code: string;

	constructor(message: string, code: string) {
		super(message);

		this.code = code;

		Error.captureStackTrace?.(this, this.constructor);
	}
}
