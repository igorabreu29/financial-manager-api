# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server with hot reload (tsx watch)
pnpm test             # Run all tests (vitest run)
pnpm test:watch       # Run tests in watch mode
pnpm lint:fix         # Lint and auto-fix with Biome
pnpm build            # Build with tsup
pnpm prisma:generate  # Regenerate Prisma client after schema changes
pnpm prisma:deploy    # Run pending migrations
pnpm compose:up       # Start test Postgres container
```

Run a single test file:
```bash
pnpm vitest run src/domain/accounts/app/use-cases/register-user.spec.ts
```

## Architecture

This is a **Clean Architecture / DDD** API built with Fastify + Prisma + TypeScript.

### Layer structure

```
src/core/           # Shared primitives: Either, base entities, domain events, generic errors
src/domain/         # Business logic (no framework dependencies)
  accounts/         # Bounded context: users, auth, password reset
  transactions/     # Bounded context: categories, transactions
src/infra/          # Framework/infrastructure implementations
  http/             # Fastify controllers, presenters, error mapping
  database/         # Prisma adapters, mappers, generated client
  cryptography/     # Bcrypt and JWT implementations
tests/              # Test helpers: in-memory repos, fakes, factories, e2e setup
```

### Within each domain bounded context

```
enterprise/entities/   # Domain entities with business rules
enterprise/events/     # Domain events dispatched by entities
app/use-cases/         # Application use cases (*.spec.ts co-located)
app/repositories/      # Repository interfaces (ports)
app/subscribers/       # Domain event handlers
```

### Key patterns

**Either type** — all use cases return `Either<DomainError, SuccessValue>`. Check with `result.failure()` / `result.success()`, then access `result.value`.

**Factory functions** — each HTTP controller instantiates its use case via a `factories/make-*.ts` file that wires together the concrete infrastructure adapters.

**Error flow** — use cases return typed domain errors → HTTP controllers call `dispatchError(result.value)` to convert to HTTP errors (`BadRequestError`, `ConflictError`) → global `errorHandler` in `src/error-handler.ts` serializes all errors.

**Domain events** — entities call `DomainEvents.dispatch()` after persistence. Subscribers (e.g., `OnUserRegistered`) register themselves in their constructor and react to events. When a user registers, default global categories are automatically created.

**Presenters** — `src/infra/http/presenters/` shape domain entities for HTTP responses.

### Testing approach

- **Unit tests** (`.spec.ts` alongside use cases): use in-memory repositories from `tests/repositories/` and fake implementations from `tests/cryptography/`, `tests/mail/`. No real DB or network calls.
- **E2E tests**: import `tests/setup-e2e.ts` as a vitest setup file. It creates a unique Postgres schema per test run, runs `prisma db push`, truncates between tests, and drops the schema on teardown. Requires a running Postgres (use `pnpm compose:up`).

### Environment variables

Validated at startup via Zod in `src/infra/env/index.ts`. Required: `DATABASE_URL`, `JWT_SECRET`, `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS`, `MAIL_PORT`, `MAIL_SECURE`, `WEB_URL`. Optional: `PORT` (default 3333), `BCRYPT_ROUND` (default 12), `NODE_ENV`.

### Path aliases

`@/*` resolves to both `./src/*` and `./tests/*` (see `tsconfig.json`).

### Prisma client

Generated into `src/infra/database/generated/prisma/` as ESM `.ts` files. Always run `pnpm prisma:generate` after modifying `src/infra/database/prisma/schema.prisma`.

### API docs

Swagger/Scalar UI is served at `/docs` in dev mode.
