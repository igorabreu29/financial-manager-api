import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeResetPasswordUseCase } from "./factories/make-reset-password-use-case.ts";

export const resetPassword: FastifyPluginCallbackZod = app => {
	app.patch(
		"/reset/password",
		{
			schema: {
				summary: "Reset user passsword",
				tags: ["accounts"],
				body: z
					.object({
						code: z.uuid(),
						password: z
							.string()
							.min(6, {
								error: "The password must be greater or equal 6 characters.",
							})
							.max(50, {
								error: "The password must be less or equal 50 characters.",
							}),
						confirmPassword: z
							.string()
							.min(6, {
								error: "The password must be greater or equal 6 characters.",
							})
							.max(50, {
								error: "The password must be less or equal 50 characters.",
							}),
					})
					.refine(fields => fields.password === fields.confirmPassword, {
						error: "Passwords does not match!",
						path: ["confirmPassword"],
					}),
				response: {
					204: z.null(),
				},
			},
		},
		async (req, res) => {
			const { code, password, confirmPassword } = req.body;
			const useCase = makeResetPasswordUseCase();

			const result = await useCase.execute({ code, password, confirmPassword });

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			return res.status(StatusCode.NO_CONTENT).send();
		}
	);
};
