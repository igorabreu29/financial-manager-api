import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { UserPresenter } from "../../presenters/user-presenter.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeAuthenticateWithCredentialsUseCase } from "./factories/make-authenticate-with-credentials-use-case.ts";

export const authenticateWithCredentials: FastifyPluginCallbackZod = app => {
	app.post(
		"/sign-in",
		{
			schema: {
				summary: "Authenticate user",
				tags: ["accounts"],
				body: z.object({
					email: z.email({ error: "Invalid e-mail format." }),
					password: z
						.string()
						.min(6, {
							error: "The password must be greater or equal 6 characters.",
						})
						.max(50, {
							error: "The password must be less or equal 50 characters.",
						}),
				}),
				response: {
					201: z.object({
						token: z.jwt(),
						user: z.object({
							id: z.uuidv4(),
							name: z.string(),
							email: z.email(),
							avatar_url: z.url().nullable(),
							created_at: z.string(),
						}),
					}),
				},
			},
		},
		async (req, res) => {
			const { email, password } = req.body;

			const useCase = makeAuthenticateWithCredentialsUseCase();
			const result = await useCase.execute({
				email,
				password,
			});

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			const { user, token } = result.value;

			return res.status(StatusCode.CREATED).send({
				user: UserPresenter.toHTTP(user),
				token,
			});
		}
	);
};
