import type { FastifyRequest } from "fastify";
import { UnauthorizedError } from "../errors/unauthorized-error.ts";

export async function verifyJWT(req: FastifyRequest) {
	try {
		await req.jwtVerify();
	} catch {
		throw new UnauthorizedError("Invalid or missing access token.");
	}
}
