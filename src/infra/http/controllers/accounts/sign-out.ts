import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { clearCookies } from "../../utils/set-auth-cookies.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeSignOutUseCase } from "./factories/make-sign-out-use-case.ts";

export const signOut: FastifyPluginCallbackZod = app => {
	app.post(
		"/sign-out",
		{
			schema: {
				summary: "Sign out",
				tags: ["accounts"],
				response: {
					200: z.object({}),
				},
			},
		},
		async (req, res) => {
			const token = req.cookies.refresh_token ?? "";

			const useCase = makeSignOutUseCase();
			await useCase.execute({ token });

			clearCookies(res);

			return res.status(StatusCode.OK).send({});
		}
	);
};
