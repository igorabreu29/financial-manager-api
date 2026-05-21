import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeDeleteWalletUseCase } from "./factories/make-delete-wallet-use-case.ts";

export const deleteWallet: FastifyPluginCallbackZod = app => {
	app.delete(
		"/wallets/:walletId",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "Delete Wallet",
				tags: ["wallets"],
				params: z.object({
					walletId: z.uuidv4({ error: "Invalid UUID." }),
				}),
				response: {
					204: z.void(),
				},
			},
		},
		async (req, res) => {
			const payload = req.user;
			const { walletId } = req.params;

			const useCase = makeDeleteWalletUseCase();
			const result = await useCase.execute({
				walletId,
				userId: payload.sub,
			});

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			return res.status(StatusCode.NO_CONTENT).send();
		}
	);
};
