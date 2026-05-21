import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { TransactionPresenter } from "../../presenters/transaction-presenter.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeCreateTransactionUseCase } from "./factories/make-create-transaction-use-case.ts";

export const createTransaction: FastifyPluginCallbackZod = app => {
	app.post(
		"/wallets/:walletId/categories/:categoryId/transactions",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "Create Transaction",
				tags: ["transactions"],
				params: z.object({
					walletId: z.uuidv4({ error: "Invalid UUID." }),
					categoryId: z.uuidv4({ error: "Invalid UUID." }),
				}),
				body: z.object({
					description: z
						.string()
						.nonempty({ error: "Description cannot be empty!" }),
					type: z.enum(["income", "outcome"]),
					price: z
						.int()
						.positive({ error: "Price should be a positive number!" }),
				}),
				response: {
					201: z.object({
						transaction: z.object({
							id: z.uuidv4(),
							wallet_id: z.uuidv4(),
							user_id: z.uuidv4(),
							category_id: z.uuidv4(),
							description: z.string(),
							price: z.number(),
							type: z.enum(["income", "outcome"]),
							created_at: z.string(),
						}),
					}),
				},
			},
		},
		async (req, res) => {
			const payload = req.user;
			const { walletId, categoryId } = req.params;
			const { price, description, type } = req.body;

			const useCase = makeCreateTransactionUseCase();
			const result = await useCase.execute({
				categoryId,
				walletId,
				description,
				price,
				type,
				userId: payload.sub,
			});

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			const { transaction } = result.value;

			return res.status(StatusCode.CREATED).send({
				transaction: TransactionPresenter.toHTTP(transaction),
			});
		}
	);
};
