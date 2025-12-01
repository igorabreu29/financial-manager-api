import { resolve } from "node:path";
import { cwd } from "node:process";
import { Worker } from "node:worker_threads";
import type {
	Mailer,
	MailerSendEmailParams,
} from "@/domain/accounts/app/mail/mailer.ts";
import { env } from "@/infra/env/index.ts";

export class NodeMailer implements Mailer {
	async sendEmail({ to, code }: MailerSendEmailParams): Promise<void> {
		const data = {
			from: "fasfeet-dev@dev.com",
			to,
			subject: "Financial Manager - Forgot Password",
			html: `
							<h1>Redefina sua senha</h1>
							<hr />

							<button style="background-color: #cccc; border: 0; border-radius: 4px; padding: 0.5rem;">
								<a target="_blank" rel="noopener noreferrer" href=${env.WEB_URL}?code=${code} style="color: white˝;">Restore your password.</a>
							</button>
						`,
		};

		const worker = new Worker(resolve(cwd(), "./src/infra/workers/worker.ts"), {
			workerData: {
				data,
				env: {
					host: env.MAIL_HOST,
					port: env.MAIL_PORT,
					secure: env.MAIL_SECURE,
					user: env.MAIL_USER,
					pass: env.MAIL_PASS,
				},
			},
		});

		worker.on("message", data => {
			console.log(data);
		});

		worker.on("error", () => {
			worker.terminate();
		});
	}
}
