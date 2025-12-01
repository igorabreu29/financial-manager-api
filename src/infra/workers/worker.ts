import { parentPort, workerData } from "node:worker_threads";
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
	host: workerData.env.host,
	port: workerData.env.port,
	secure: workerData.env.secure,
	auth: {
		user: workerData.env.user,
		pass: workerData.env.pass,
	},
});

async function workerFunction() {
	try {
		const info = await transporter.sendMail(workerData.data);
		parentPort?.postMessage({ success: true, info });
	} catch (error: any) {
		parentPort?.postMessage({ success: false, error: error.message });
	}
}

await workerFunction();
