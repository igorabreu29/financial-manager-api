import 'dotenv/config'

import path from 'node:path'
import { defineConfig, env } from 'prisma/config'

const schema = 'src/infra/database/prisma'

export default defineConfig({
	schema: path.join(schema, 'schema.prisma'),
	migrations: {
		path: path.join(schema, 'migrations/schema.prisma'),
	},
	datasource: {
		url: env('DATABASE_URL'),
	},
})
