import nodemailer from "nodemailer";
import { env } from "@/infra/env/index.ts";

export const transporter = nodemailer.createTransport({
	host: env.MAIL_HOST,
	port: env.MAIL_PORT,
	secure: env.MAIL_SECURE,
	auth: {
		user: env.MAIL_USER,
		pass: env.MAIL_PASS,
	},
});
