import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { setCookies } from "../../utils/set-auth-cookies.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeRefreshTokenUseCase } from "./factories/make-refresh-token-use-case.ts";

export const refreshToken: FastifyPluginCallbackZod = app => {
	app.post(
		"/refresh",
		{
			schema: {
				summary: "Refresh access token",
				tags: ["accounts"],
				response: {
					200: z.object({}),
				},
			},
		},
		async (req, res) => {
			const token = req.cookies.refresh_token ?? "";

			const useCase = makeRefreshTokenUseCase();
			const result = await useCase.execute({ token });

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			const { accessToken, refreshToken: newRefreshToken } = result.value;

			setCookies(res, accessToken, newRefreshToken);

			return res.status(StatusCode.OK).send({});
		}
	);
};
