import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { CategoryPresenter } from "../../presenters/category-presenter.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeCreateCategoryUseCase } from "./factories/make-create-category-use-case.ts";

export const createCategory: FastifyPluginCallbackZod = app => {
	app.post(
		"/categories",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "Create Category",
				tags: ["categories"],
				body: z.object({
					name: z
						.string()
						.min(3, { error: "Name cannot be less than 3 characters." }),
				}),
				response: {
					201: z.object({
						category: z.object({
							id: z.uuidv4(),
							name: z.string(),
							user_id: z.uuidv4().optional(),
							is_active: z.boolean(),
							is_global: z.boolean(),
						}),
					}),
				},
			},
		},
		async (req, res) => {
			const { name } = req.body;
			const payload = req.user;

			const useCase = makeCreateCategoryUseCase();
			const result = await useCase.execute({
				name,
				userId: payload.sub,
			});

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			const { category } = result.value;

			return res.status(StatusCode.CREATED).send({
				category: CategoryPresenter.toHTTP(category),
			});
		}
	);
};
