import type { FastifyInstance } from "fastify";
import {
	hasZodFastifySchemaValidationErrors,
	ResponseSerializationError,
} from "fastify-type-provider-zod";
import z, { ZodError } from "zod";
import { BadRequestError } from "./infra/http/errors/bad-request-error.ts";
import { ConflictError } from "./infra/http/errors/conflict-error.ts";
import { UnauthorizedError } from "./infra/http/errors/unauthorized-error.ts";
import { CommonCode } from "./infra/http/utils/common-code.ts";
import { StatusCode } from "./infra/http/utils/status-code.ts";

type FastifyErrorHandler = FastifyInstance["errorHandler"];

export const errorHandler: FastifyErrorHandler = (error, _, res) => {
	if (hasZodFastifySchemaValidationErrors(error)) {
		const formattedErrors = error.validation.map(err => {
			const instancePathsSplited = err?.instancePath?.split("/");

			const field =
				err?.instancePath?.split("/")[instancePathsSplited?.length - 1];
			const message = err.message || "Invalid value";
			return { field, message };
		});

		return res.status(StatusCode.BAD_REQUEST).send({
			code: CommonCode.VALIDATION_ERROR,
			message: "Validation error",
			errors: formattedErrors,
		});
	}

	if (error instanceof ResponseSerializationError) {
		const formattedErrors = error.cause.issues.map(issue => {
			return {
				field: issue.path,
				message: issue.message,
			};
		});

		return res.status(StatusCode.BAD_REQUEST).send({
			code: CommonCode.VALIDATION_ERROR,
			message: "Validation error",
			errors: formattedErrors,
		});
	}

	if (error instanceof ZodError) {
		return res.status(StatusCode.BAD_REQUEST).send({
			statusCode: StatusCode.BAD_REQUEST,
			code: CommonCode.VALIDATION_ERROR,
			message: z.treeifyError(error),
		});
	}

	if (
		[UnauthorizedError.name, ConflictError.name, BadRequestError.name].includes(
			error?.constructor?.name
		)
	) {
		return res.status(error?.statusCode || StatusCode.BAD_REQUEST).send({
			statusCode: error.statusCode,
			code: error.code,
			message: error.message,
		});
	}

	return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({
		message: "Internal server error",
		code: CommonCode.INTERNAL_SERVER_ERROR,
	});
};
