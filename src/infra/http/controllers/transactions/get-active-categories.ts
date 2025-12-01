import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { CategoryPresenter } from "../../presenters/category-presenter.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeFetchActiveCategoriesUseCase } from "./factories/make-fetch-active-categories-use-case.ts";

export const getActiveCategories: FastifyPluginCallbackZod = app => {
	app.get(
		"/categories/active",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "List Active Categories",
				tags: ["categories"],
				querystring: z.object({
					name: z.string().optional(),
				}),
				response: {
					200: z.object({
						categories: z.array(
							z.object({
								id: z.uuidv4(),
								name: z.string(),
								user_id: z.uuidv4().optional(),
								is_active: z.boolean(),
								is_global: z.boolean(),
							})
						),
					}),
				},
			},
		},
		async (req, res) => {
			const payload = req.user;
			const { name } = req.query;

			const useCase = makeFetchActiveCategoriesUseCase();
			const result = await useCase.execute({
				userId: payload.sub,
				name,
			});

			if (result.failure()) return;

			const { categories } = result.value;

			return res.status(StatusCode.OK).send({
				categories: categories.map(CategoryPresenter.toHTTP),
			});
		}
	);
};
