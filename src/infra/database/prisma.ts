import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../env/index.ts";
import { PrismaClient } from "./generated/prisma/client.ts";

const url = new URL(env.DATABASE_URL);
const schema = url.searchParams.get("schema") ?? undefined;
if (schema) url.searchParams.delete("schema");
const connectionString = url.toString();

const adapter = new PrismaPg({ connectionString }, { schema });

export const prisma = new PrismaClient({
	log: ["warn", "error"],
	adapter,
});
