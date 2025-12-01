import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeUpdateCategoryUseCase } from "./factories/make-update-category-use-case.ts";

export const updateCategory: FastifyPluginCallbackZod = app => {
	app.put(
		"/categories/:categoryId",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "Update Category",
				tags: ["categories"],
				params: z.object({
					categoryId: z.uuidv4({ error: "Uuid inválido!" }),
				}),
				body: z.object({
					name: z
						.string()
						.min(3, { error: "Name cannot be less than 3 characters." }),
				}),
				response: {
					204: z.void(),
				},
			},
		},
		async (req, res) => {
			const { categoryId } = req.params;
			const { name } = req.body;
			const payload = req.user;

			const useCase = makeUpdateCategoryUseCase();
			const result = await useCase.execute({
				name,
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
