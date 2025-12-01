import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.url().startsWith("postgresql://"),
	PORT: z.coerce.number().default(3333),
	NODE_ENV: z.enum(["test", "production", "dev"]).default("dev"),
	JWT_SECRET: z.string(),
	BCRYPT_ROUND: z.coerce.number().default(12),
	MAIL_SECURE: z.string().transform(secure => new Boolean(secure) === true),
	MAIL_HOST: z.string(),
	MAIL_PORT: z.coerce.number().default(443),
	MAIL_USER: z.string(),
	MAIL_PASS: z.string(),
	WEB_URL: z.url(),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
	console.error("Invalid environment variables.", _env.error.format());

	throw new Error("Invalid environment variables.");
}

export const env = _env.data;
