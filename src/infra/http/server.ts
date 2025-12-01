import { app } from "@/app.ts";
import { prisma } from "@/infra/database/prisma.ts";
import { env } from "@/infra/env/index.ts";

async function main() {
	try {
		await prisma.$connect();

		await app.listen({ port: env.PORT, host: "0.0.0.0" });
		console.log(`Server running on port 3333 (/docs)`);
	} catch (error) {
		console.error(error);
		await prisma.$disconnect();
	}
}

await main();
