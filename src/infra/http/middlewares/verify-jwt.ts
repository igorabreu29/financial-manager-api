import type { FastifyRequest } from "fastify";

export async function verifyJWT(req: FastifyRequest) {
	const payload = await req.jwtVerify();
	return payload;
}
