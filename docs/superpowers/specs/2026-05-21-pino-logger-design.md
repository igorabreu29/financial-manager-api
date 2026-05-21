# Pino Logger with AsyncLocalStorage — Design Spec

**Date:** 2026-05-21  
**Status:** Approved

---

## Overview

Add structured request logging to the API using Fastify's built-in pino logger and AsyncLocalStorage to propagate request context through the HTTP layer.

---

## Goals

- Emit structured logs for every request/response automatically (method, url, statusCode, responseTime, requestId)
- Pretty-print logs in development; emit JSON in production
- Expose `requestId` anywhere in the HTTP layer without threading `req` through function signatures
- Zero changes to domain or use-case layers

---

## Non-Goals

- Logging inside use cases or domain entities
- Capturing request body, query params, or user identity in logs
- Writing logs to files or external transports

---

## Architecture

### 1. Fastify logger configuration (`src/app.ts`)

`fastify()` is instantiated with a `logger` option:

- **Production** (`NODE_ENV === 'production'`): `logger: true` — emits newline-delimited JSON to stdout.
- **Development**: `logger: { transport: { target: 'pino-pretty', options: { colorize: true } } }` — human-readable output in the terminal.

Fastify automatically emits one log line when a request is received and one when the response is sent, including `method`, `url`, `statusCode`, and `responseTime`. No manual hooks are needed for this.

`pino-pretty` is added as a `devDependency` only.

### 2. Request context store (`src/infra/http/logger/request-context.ts`)

Exports:
- `requestContext: AsyncLocalStorage<{ requestId: string }>` — the storage instance.
- `getRequestId(): string | undefined` — convenience helper that reads `requestContext.getStore()?.requestId`.

The `requestId` is sourced from `req.id`, which Fastify generates automatically per request.

### 3. Request context plugin (`src/infra/http/plugins/request-context-plugin.ts`)

A `FastifyPluginCallback` that registers an `addHook('onRequest', ...)` to call `requestContext.run({ requestId: req.id }, done)`. This ensures every subsequent async operation within that request runs inside the AsyncLocalStorage context.

Registered in `src/app.ts` via `app.register(requestContextPlugin)` before route plugins.

### 4. Server cleanup (`src/infra/http/server.ts`)

Replace `console.log` / `console.error` with `app.log.info` / `app.log.error` so startup/shutdown messages go through pino as well.

---

## File Changes

| File | Action |
|------|--------|
| `src/app.ts` | Add `logger` config to `fastify()` call; register `requestContextPlugin` |
| `src/infra/http/server.ts` | Replace `console.log`/`console.error` with `app.log` |
| `src/infra/http/logger/request-context.ts` | **New** — AsyncLocalStorage instance + `getRequestId()` helper |
| `src/infra/http/plugins/request-context-plugin.ts` | **New** — Fastify plugin that seeds the store on each request |
| `package.json` | Add `pino-pretty` as devDependency |

---

## Data Flow

```
Incoming request
  → Fastify receives → emits "request received" log (pino)
  → onRequest hook fires → requestContext.run({ requestId }, done)
  → Controller executes (requestId available via getRequestId())
  → Response sent → Fastify emits "response" log with statusCode + responseTime
```

---

## Testing

- No unit tests needed for the logger configuration itself (it's wiring, not logic).
- `getRequestId()` can be tested in isolation by wrapping a call in `requestContext.run(...)`.
- Existing e2e tests remain unaffected — the logger writes to stdout and does not interfere with test assertions.

---

## Dependencies

| Package | Type | Reason |
|---------|------|--------|
| `pino-pretty` | devDependency | Pretty-print logs in development |

No new runtime dependencies. Pino ships with Fastify.
