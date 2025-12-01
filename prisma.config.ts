import 'dotenv/config'

import path from 'node:path'
import { defineConfig, env } from 'prisma/config'

if (!process.env.PATH_TO_PRISMA) {
	throw new Error("PATH_TO_PRISMA variable is required!");
}

const schema = process.env.PATH_TO_PRISMA;

export default defineConfig({
	schema: path.join(schema, 'schema.prisma'),
	migrations: {
		path: path.join(schema, 'migrations/schema.prisma'),
	},
	datasource: {
		url: env('DATABASE_URL'),
	},
})
