import type { FastifyReply } from "fastify";
import { env } from "@/infra/env/index.ts";

const isProduction = env.NODE_ENV === "production";

export function setCookies(
	res: FastifyReply,
	accessToken: string,
	refreshToken: string
): void {
	res
		.setCookie("access_token", accessToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: "lax",
			maxAge: 15 * 60,
			path: "/",
		})
		.setCookie("refresh_token", refreshToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: "lax",
			maxAge: 7 * 24 * 60 * 60,
			path: "/accounts",
		});
}

export function clearCookies(res: FastifyReply): void {
	const base = {
		httpOnly: true,
		secure: isProduction,
		sameSite: "lax" as const,
	};
	res
		.clearCookie("access_token", { ...base, path: "/" })
		.clearCookie("refresh_token", { ...base, path: "/accounts" });
}
