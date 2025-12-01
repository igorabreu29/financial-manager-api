import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeDeleteTransactionUseCase } from "./factories/make-delete-transaction-use-case.ts";

export const deleteTransaction: FastifyPluginCallbackZod = app => {
	app.delete(
		"/transactions/:transactionId",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "Delete Transaction",
				tags: ["transactions"],
				params: z.object({
					transactionId: z.uuidv4(),
				}),
				response: {
					204: z.void(),
				},
			},
		},
		async (req, res) => {
			const payload = req.user;
			const { transactionId } = req.params;

			const useCase = makeDeleteTransactionUseCase();
			const result = await useCase.execute({
				transactionId,
				userId: payload.sub,
			});

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			return res.status(StatusCode.NO_CONTENT).send();
		}
	);
};
