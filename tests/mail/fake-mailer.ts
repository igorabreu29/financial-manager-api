import type {
	Mailer,
	MailerSendEmailParams,
} from "@/domain/accounts/app/mail/mailer.ts";

export class FakeMailer implements Mailer {
	public emails: MailerSendEmailParams[] = [];

	async sendEmail(params: MailerSendEmailParams): Promise<void> {
		this.emails.push(params);
	}
}
