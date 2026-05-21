# Pino Logger with AsyncLocalStorage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured pino request logging to the Fastify API with AsyncLocalStorage to expose `requestId` anywhere in the HTTP layer.

**Architecture:** Fastify's built-in pino logger is activated via the `logger` option on `fastify()`. A dedicated Fastify plugin seeds an `AsyncLocalStorage` store with `req.id` on every incoming request. A thin helper module exposes `getRequestId()` for consumers that need the current request ID without holding a reference to `req`.

**Tech Stack:** Fastify 5, pino (bundled with Fastify), pino-pretty (devDependency), Node.js `AsyncLocalStorage`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/infra/http/logger/request-context.ts` | Create | AsyncLocalStorage instance + `getRequestId()` helper |
| `src/infra/http/plugins/request-context-plugin.ts` | Create | Fastify plugin that seeds the store on each request |
| `src/app.ts` | Modify | Add `logger` config to `fastify()`; register `requestContextPlugin` |
| `src/infra/http/server.ts` | Modify | Replace `console.log`/`console.error` with `app.log` |
| `package.json` | Modify | Add `pino-pretty` as devDependency |

---

### Task 1: Install pino-pretty

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install pino-pretty as devDependency**

```bash
pnpm add -D pino-pretty
```

Expected output: `devDependencies` in `package.json` updated with `pino-pretty`.

- [ ] **Step 2: Verify installation**

```bash
pnpm list pino-pretty
```

Expected: `pino-pretty` listed with a version number.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add pino-pretty as devDependency"
```

---

### Task 2: Create the request context module

**Files:**
- Create: `src/infra/http/logger/request-context.ts`

- [ ] **Step 1: Write the test**

Create `src/infra/http/logger/request-context.spec.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { getRequestId, requestContext } from "./request-context.ts";

describe("requestContext", () => {
  it("returns undefined when called outside a context", () => {
    expect(getRequestId()).toBeUndefined();
  });

  it("returns the requestId when called inside a context", () => {
    let result: string | undefined;

    requestContext.run({ requestId: "req-abc-123" }, () => {
      result = getRequestId();
    });

    expect(result).toBe("req-abc-123");
  });

  it("returns undefined after the context run completes", () => {
    requestContext.run({ requestId: "req-xyz" }, () => {});
    expect(getRequestId()).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
pnpm vitest run src/infra/http/logger/request-context.spec.ts
```

Expected: FAIL — `Cannot find module './request-context.ts'`

- [ ] **Step 3: Implement the module**

Create `src/infra/http/logger/request-context.ts`:

```typescript
import { AsyncLocalStorage } from "node:async_hooks";

type RequestStore = {
  requestId: string;
};

export const requestContext = new AsyncLocalStorage<RequestStore>();

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

```bash
pnpm vitest run src/infra/http/logger/request-context.spec.ts
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/infra/http/logger/request-context.ts src/infra/http/logger/request-context.spec.ts
git commit -m "feat: add request context AsyncLocalStorage module"
```

---

### Task 3: Create the request context Fastify plugin

**Files:**
- Create: `src/infra/http/plugins/request-context-plugin.ts`

- [ ] **Step 1: Create the plugin**

```typescript
import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import { requestContext } from "../logger/request-context.ts";

const requestContextPlugin: FastifyPluginCallback = (app, _, done) => {
  app.addHook("onRequest", (req, _, next) => {
    requestContext.run({ requestId: String(req.id) }, next);
  });

  done();
};

export default fp(requestContextPlugin);
```

> **Note:** `fastify-plugin` (`fp`) is used so the hook is registered on the root Fastify instance and applies to all routes, not just those inside the plugin's scope. Check if `fastify-plugin` is already a dependency first:

```bash
pnpm list fastify-plugin
```

If not listed, install it:

```bash
pnpm add fastify-plugin
```

- [ ] **Step 2: Commit**

```bash
git add src/infra/http/plugins/request-context-plugin.ts
git commit -m "feat: add Fastify plugin to seed request context store"
```

---

### Task 4: Configure pino logger and register the plugin in app.ts

**Files:**
- Modify: `src/app.ts`

- [ ] **Step 1: Update `src/app.ts`**

Replace the current `src/app.ts` with the version below. The only changes are:
1. Import `requestContextPlugin`
2. Import `env`-based logger config
3. Pass `logger` option to `fastify()`
4. Register `requestContextPlugin` before routes

```typescript
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { env } from "@/infra/env/index.ts";
import { errorHandler } from "./error-handler.ts";
import requestContextPlugin from "./infra/http/plugins/request-context-plugin.ts";
import { accounts } from "./infra/http/controllers/accounts/index.ts";
import { healthCheck } from "./infra/http/controllers/health.ts";
import { transactions } from "./infra/http/controllers/transactions/index.ts";

const loggerConfig =
  env.NODE_ENV === "production"
    ? true
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      };

export const app = fastify({ logger: loggerConfig }).withTypeProvider<ZodTypeProvider>();
app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.setErrorHandler(errorHandler);

app.register(requestContextPlugin);

app.register(fastifyCors, {
  origin: env.NODE_ENV === "production" ? [] : "*",
  allowedHeaders: ["GET", "PATCH", "POST", "OPTIONS", "PUT", "DELETE"],
});

app.register(import("@fastify/helmet"), {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https:", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "no-referrer" },
  frameguard: { action: "deny" },
});

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
});

await app.register(import("@fastify/swagger"), {
  openapi: {
    info: {
      title: "Financial manager Api",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  transform: jsonSchemaTransform,
});

await app.register(import("@scalar/fastify-api-reference"), {
  routePrefix: "/docs",
  configuration: {
    theme: "bluePlanet",
  },
});

app.register(healthCheck);
app.register(accounts, { prefix: "accounts" });
app.register(transactions);
```

- [ ] **Step 2: Run existing tests to confirm nothing broke**

```bash
pnpm test
```

Expected: all tests pass (unit tests don't instantiate `app`, so logger config doesn't affect them).

- [ ] **Step 3: Commit**

```bash
git add src/app.ts
git commit -m "feat: configure pino logger and register request context plugin"
```

---

### Task 5: Replace console calls in server.ts

**Files:**
- Modify: `src/infra/http/server.ts`

- [ ] **Step 1: Update server.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/infra/http/server.ts
git commit -m "feat: replace console calls with pino logger in server.ts"
```

---

### Task 6: Manual smoke test

- [ ] **Step 1: Start the dev server**

```bash
pnpm compose:up   # if Postgres isn't already running
pnpm dev
```

Expected: pretty-printed log lines from pino-pretty appear instead of plain `console.log` output. Example:

```
[12:00:00] INFO: Server running on port 3333 (/docs)
[12:00:01] INFO: incoming request
    reqId: "req-1"
    req: { method: "GET", url: "/docs", ... }
[12:00:01] INFO: request completed
    reqId: "req-1"
    res: { statusCode: 200 }
    responseTime: 12
```

- [ ] **Step 2: Send a test request**

```bash
curl -s http://localhost:3333/health | jq
```

Expected: JSON response from health endpoint, and two log lines (request + response) visible in the terminal.

- [ ] **Step 3: Run full test suite one final time**

```bash
pnpm test
```

Expected: all tests pass.
