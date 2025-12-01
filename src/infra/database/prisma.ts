import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../env/index.ts";
import { PrismaClient } from "./generated/prisma/client.ts";

const connectionString = `${env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({
	log: ["warn", "error"],
	adapter,
});
