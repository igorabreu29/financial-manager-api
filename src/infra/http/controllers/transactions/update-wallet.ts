import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeUpdateWalletUseCase } from "./factories/make-update-wallet-use-case.ts";

export const updateWallet: FastifyPluginCallbackZod = app => {
	app.put(
		"/wallets/:walletId",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "Update Wallet",
				tags: ["wallets"],
				params: z.object({
					walletId: z.uuidv4({ error: "Invalid UUID." }),
				}),
				body: z.object({
					name: z
						.string()
						.min(3, { error: "Name cannot be less than 3 characters." }),
					description: z.string().optional().nullable(),
				}),
				response: {
					204: z.void(),
				},
			},
		},
		async (req, res) => {
			const payload = req.user;
			const { walletId } = req.params;
			const { name, description } = req.body;

			const useCase = makeUpdateWalletUseCase();
			const result = await useCase.execute({
				walletId,
				userId: payload.sub,
				name,
				description: description ?? null,
			});

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			return res.status(StatusCode.NO_CONTENT).send();
		}
	);
};
