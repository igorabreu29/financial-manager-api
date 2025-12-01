import { DomainError } from "./domain-error.ts";
import { DomainCode } from "./enums/domain-code.ts";

export class ResourceNotFoundError extends DomainError {
	constructor(resouce: string, code?: string) {
		super(`${resouce} not found!`, code ?? DomainCode.RESOURCE_NOT_FOUND_ERROR);
	}
}
