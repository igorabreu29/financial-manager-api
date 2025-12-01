export interface MailerSendEmailParams {
	to: string;
	code: string;
}

export interface Mailer {
	sendEmail(params: MailerSendEmailParams): Promise<void>;
}
