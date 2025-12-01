import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { UserPresenter } from "../../presenters/user-presenter.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeOnUserRegisteredSubscriber } from "./factories/make-on-user-registered-subscriber.ts";
import { makeRegisterUserUseCase } from "./factories/make-register-user-use-case.ts";

export const registerUser: FastifyPluginCallbackZod = app => {
	app.post(
		"/sign-on",
		{
			schema: {
				summary: "Register user",
				tags: ["accounts"],
				body: z.object({
					name: z
						.string()
						.min(3, { error: "Name cannot be less than 3 characters." }),
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
			const { email, name, password } = req.body;

			makeOnUserRegisteredSubscriber();
			const useCase = makeRegisterUserUseCase();
			const result = await useCase.execute({
				email,
				name,
				password,
			});

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			const { user } = result.value;

			return res.status(StatusCode.CREATED).send({
				user: UserPresenter.toHTTP(user),
			});
		}
	);
};
