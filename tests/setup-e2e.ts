import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { PrismaClient } from "@/infra/database/generated/prisma/client.ts";

config({ path: ".env", override: true });
config({ path: ".env.test", override: true });

const schemaId = randomUUID();

function generateDatabaseUrl(schemaId: string) {
	if (!process.env.DATABASE_URL)
		throw new Error("Please provide a DATABASE_URL environment variable");

	const url = new URL(process.env.DATABASE_URL);
	url.searchParams.set("schema", schemaId);

	return url.toString();
}

process.env.DATABASE_URL = generateDatabaseUrl(schemaId);

const prisma = new PrismaClient();

beforeAll(async () => {
	execSync("pnpm prisma db push", {
		stdio: "inherit",
	});
});

beforeEach(async () => {
	const tables = await prisma.$queryRaw<
		Array<{ tablename: string }>
	>`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

	for (const { tablename } of tables) {
		await prisma.$executeRawUnsafe(
			`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE;`
		);
	}
});

afterAll(async () => {
	await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`);
	await prisma.$disconnect();
});
