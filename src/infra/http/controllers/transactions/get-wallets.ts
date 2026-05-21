import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { WalletPresenter } from "../../presenters/wallet-presenter.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeFetchWalletsUseCase } from "./factories/make-fetch-wallets-use-case.ts";

export const getWallets: FastifyPluginCallbackZod = app => {
	app.get(
		"/wallets",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "List Wallets",
				tags: ["wallets"],
				querystring: z.object({
					page: z.string().default("1").transform(Number),
					perPage: z.string().default("10").transform(Number),
				}),
				response: {
					200: z.object({
						wallets: z.array(
							z.object({
								id: z.uuidv4(),
								user_id: z.uuidv4(),
								name: z.string(),
								description: z.string().nullable(),
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
			const { page, perPage } = req.query;

			const useCase = makeFetchWalletsUseCase();
			const result = await useCase.execute({
				userId: payload.sub,
				page,
				perPage,
			});

			if (result.failure()) return;

			const { wallets, pages, totalItems } = result.value;

			return res.status(StatusCode.OK).send({
				wallets: wallets.map(WalletPresenter.toHTTP),
				pages,
				totalItems,
			});
		}
	);
};
