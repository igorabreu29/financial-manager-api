import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastify from "fastify";
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { env } from "@/infra/env/index.ts";
import { errorHandler } from "./error-handler.ts";
import { accounts } from "./infra/http/controllers/accounts/index.ts";
import { healthCheck } from "./infra/http/controllers/health.ts";
import { transactions } from "./infra/http/controllers/transactions/index.ts";
import { loggerConfig } from "./infra/http/logger/logger-config.ts";
import requestContextPlugin from "./infra/http/plugins/request-context-plugin.ts";

export const app = fastify({
	logger: loggerConfig(),
}).withTypeProvider<ZodTypeProvider>();
app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.setErrorHandler(errorHandler);

app.register(requestContextPlugin);

app.register(fastifyCookie);

app.register(fastifyCors, {
	origin: env.WEB_URL,
	credentials: true,
	methods: ["GET", "PATCH", "POST", "OPTIONS", "PUT", "DELETE"],
	allowedHeaders: ["Content-Type", "Authorization"],
});

app.register(import("@fastify/helmet"), {
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			styleSrc: ["'self'", "https:", "'unsafe-inline'"],
			scriptSrc: ["'self'", "https:", "'unsafe-inline'"],
			imgSrc: ["'self'", "data:", "https:"],
			fontSrc: ["'self'", "https:", "data:"],
			connectSrc: ["'self'", "https:"],
		},
	},
	crossOriginEmbedderPolicy: true,
	crossOriginOpenerPolicy: { policy: "same-origin" },
	crossOriginResourcePolicy: { policy: "cross-origin" },
	referrerPolicy: { policy: "no-referrer" },
	frameguard: { action: "deny" },
});

app.register(fastifyJwt, {
	secret: env.JWT_SECRET,
	cookie: {
		cookieName: "access_token",
		signed: false,
	},
});

await app.register(import("@fastify/swagger"), {
	openapi: {
		info: {
			title: "Financial manager Api",
			version: "1.0.0",
		},
		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "access_token",
				},
			},
		},
		security: [{ cookieAuth: [] }],
	},
	transform: jsonSchemaTransform,
});

await app.register(import("@scalar/fastify-api-reference"), {
	routePrefix: "/docs",
	configuration: {
		theme: "bluePlanet",
	},
});

app.register(healthCheck);
app.register(accounts, { prefix: "accounts" });
app.register(transactions);
