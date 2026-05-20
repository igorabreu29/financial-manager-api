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

export const app = fastify().withTypeProvider<ZodTypeProvider>();
app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.setErrorHandler(errorHandler);

app.register(fastifyCors, {
	origin: env.NODE_ENV === "production" ? [] : "*",
	allowedHeaders: ["GET", "PATCH", "POST", "OPTIONS", "PUT", "DELETE"],
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
});

await app.register(import("@fastify/swagger"), {
	openapi: {
		info: {
			title: "Financial manager Api",
			version: "1.0.0",
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
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
