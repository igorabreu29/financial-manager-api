import { DomainError } from "./domain-error.ts";
import { DomainCode } from "./enums/domain-code.ts";

export class ResourceAlreadyExistsError extends DomainError {
	constructor(resouce: string, code?: string) {
		super(
			`${resouce} already exists!`,
			code ?? DomainCode.RESOURCE_ALREADY_EXISTS_ERROR
		);
	}
}
