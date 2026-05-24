import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import { requestContext } from "../logger/request-context.ts";

const requestContextPlugin: FastifyPluginCallback = (app, _, done) => {
	app.addHook("onRequest", (req, _, next) => {
		requestContext.run({ requestId: String(req.id) }, next);
	});

	done();
};

export default fp(requestContextPlugin);
