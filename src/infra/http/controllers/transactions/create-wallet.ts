import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { WalletPresenter } from "../../presenters/wallet-presenter.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeCreateWalletUseCase } from "./factories/make-create-wallet-use-case.ts";

export const createWallet: FastifyPluginCallbackZod = app => {
	app.post(
		"/wallets",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "Create Wallet",
				tags: ["wallets"],
				body: z.object({
					name: z
						.string()
						.min(3, { error: "Name cannot be less than 3 characters." }),
					description: z.string().optional().nullable(),
				}),
				response: {
					201: z.object({
						wallet: z.object({
							id: z.uuidv4(),
							user_id: z.uuidv4(),
							name: z.string(),
							description: z.string().nullable(),
							created_at: z.string(),
						}),
					}),
				},
			},
		},
		async (req, res) => {
			const payload = req.user;
			const { name, description } = req.body;

			const useCase = makeCreateWalletUseCase();
			const result = await useCase.execute({
				name,
				description,
				userId: payload.sub,
			});

			if (result.failure()) return;

			const { wallet } = result.value;

			return res.status(StatusCode.CREATED).send({
				wallet: WalletPresenter.toHTTP(wallet),
			});
		}
	);
};
