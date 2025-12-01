import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { TransactionPresenter } from "../../presenters/transaction-presenter.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeFetchTransactionsUseCase } from "./factories/make-fetch-transactions-use-case.ts";

export const getTransactions: FastifyPluginCallbackZod = app => {
	app.get(
		"/transactions",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "List transactions",
				tags: ["transactions"],
				querystring: z.object({
					description: z.string().optional(),
					type: z.enum(["income", "outcome"]).optional(),
					page: z.string().default("1").transform(Number),
					perPage: z.string().default("20").transform(Number),
				}),
				response: {
					200: z.object({
						transactions: z.array(
							z.object({
								id: z.uuidv4(),
								user_id: z.uuidv4(),
								category_id: z.uuidv4(),
								description: z.string(),
								price: z.number(),
								type: z.enum(["income", "outcome"]),
								created_at: z.string(),
							})
						),
						pages: z.number(),
						totalItems: z.number(),
					}),
				},
			},
		},
		async (req, res) => {
			const payload = req.user;
			const { page, perPage, description, type } = req.query;

			const useCase = makeFetchTransactionsUseCase();
			const result = await useCase.execute({
				userId: payload.sub,
				description,
				type,
				page,
				perPage,
			});

			if (result.failure()) return;

			const { pages, totalItems, transactions } = result.value;

			return res.status(StatusCode.OK).send({
				transactions: transactions.map(TransactionPresenter.toHTTP),
				pages,
				totalItems,
			});
		}
	);
};
