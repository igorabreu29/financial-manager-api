import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { StatusCode } from "../utils/status-code.ts";

export const healthCheck: FastifyPluginCallbackZod = app => {
	app.get(
		"/health",
		{
			schema: {
				summary: "Verify if server is running",
				tags: ["health"],
				response: {
					200: z.object({
						ok: z.boolean(),
					}),
				},
			},
		},
		async (_, res) => {
			return res.status(StatusCode.OK).send({
				ok: true,
			});
		}
	);
};
