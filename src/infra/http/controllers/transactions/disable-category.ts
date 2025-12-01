import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeDisableCategoryUseCase } from "./factories/make-disable-category-use-case.ts";

export const disableCategory: FastifyPluginCallbackZod = app => {
	app.patch(
		"/categories/:categoryId/disable",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "Disable Category",
				tags: ["categories"],
				params: z.object({
					categoryId: z.uuidv4({ error: "Uuid inválido!" }),
				}),
				response: {
					204: z.void(),
				},
			},
		},
		async (req, res) => {
			const { categoryId } = req.params;
			const payload = req.user;

			const useCase = makeDisableCategoryUseCase();
			const result = await useCase.execute({
				categoryId,
				userId: payload.sub,
			});

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			return res.status(StatusCode.NO_CONTENT).send();
		}
	);
};
