import { app } from "@/app.ts";
import { prisma } from "@/infra/database/prisma.ts";
import { env } from "@/infra/env/index.ts";

async function main() {
	try {
		await prisma.$connect();

		await app.listen({ port: env.PORT, host: "0.0.0.0" });
		app.log.info(`Server running on port ${env.PORT} (/docs)`);
	} catch (error) {
		app.log.error(error, "Fatal error during startup");
		await prisma.$disconnect();
	}
}

await main();
