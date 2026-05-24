import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeRequestCodeToChangePasswordUseCase } from "./factories/make-request-code-to-change-password-use-case.ts";

export const requestCode: FastifyPluginCallbackZod = app => {
	app.post(
		"/request/password",
		{
			schema: {
				summary: "Request code to change user password",
				tags: ["accounts"],
				body: z.object({
					email: z.email({ error: "Invalid e-mail format." }),
				}),
				response: {
					204: z.null(),
				},
			},
		},
		async (req, res) => {
			const { email } = req.body;
			const useCase = makeRequestCodeToChangePasswordUseCase();

			const result = await useCase.execute({ email });

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			return res.status(StatusCode.NO_CONTENT).send(null);
		}
	);
};
