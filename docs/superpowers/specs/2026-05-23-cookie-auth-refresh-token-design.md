# Cookie Auth + Refresh Token — Design Spec

**Date:** 2026-05-23  
**Status:** Approved  
**Context:** SPA client consuming a Fastify + Prisma API

---

## Problem

The current auth returns a JWT access token in the response body with 1-day expiry and no refresh mechanism. Moving to HttpOnly cookies eliminates XSS token theft, and adding a short-lived access token + long-lived refresh token improves security posture.

---

## Goals

- Access token in HttpOnly cookie, 15-minute expiry
- Refresh token in HttpOnly cookie, 7-day expiry, stored in DB
- Token rotation on every refresh (old token deleted, new one issued)
- CSRF protection via `SameSite=Lax` + strict CORS origin
- Sign-out invalidates the refresh token from DB and clears both cookies

---

## Non-Goals

- "Remember me" / sliding session expiry
- Multiple concurrent sessions / device management UI
- OAuth / third-party login

---

## Security Tradeoffs

### CSRF
`SameSite=Lax` prevents cross-site requests on state-changing methods (POST, PUT, DELETE, PATCH). Combined with `credentials: true` + a specific `origin` in CORS (never wildcard), no other origin can make authenticated mutation requests or read responses.

### XSS
HttpOnly cookies are inaccessible to JavaScript, eliminating the most common token theft vector. An XSS attacker cannot read or exfiltrate the tokens.

### Refresh token theft
If a refresh token is stolen and used, token rotation means the legitimate user's next refresh will find the token already rotated and fail with 401, signaling a breach. The attacker's stolen token becomes invalid on next legitimate use.

### Cookie path scoping
`refresh_token` cookie is scoped to `path: /accounts/refresh`, so the browser only sends it to that specific endpoint. Reduces surface area if other API routes are ever compromised.

---

## Architecture

### Flow

```
POST /accounts/sign-in
  → validate credentials (email + password)
  → generate access token JWT (15min, @fastify/jwt)
  → generate opaque refresh token (crypto.randomUUID(), 7 days)
  → persist refresh token in DB
  → set both HttpOnly cookies
  → respond with user data only (no token in body)

Authenticated request
  → @fastify/jwt reads access_token cookie automatically
  → req.jwtVerify() validates signature + expiry

POST /accounts/refresh
  → read refresh_token cookie
  → find in DB, validate expiry
  → delete old refresh token (rotation)
  → create new refresh token in DB
  → generate new access token JWT
  → set new cookies

POST /accounts/sign-out
  → read refresh_token cookie
  → delete from DB (idempotent: no error if not found)
  → clear both cookies
```

### Cookie Configuration

```
access_token:
  httpOnly: true
  secure: true (production) / false (dev)
  sameSite: 'lax'
  maxAge: 900 (15 * 60 seconds)
  path: /

refresh_token:
  httpOnly: true
  secure: true (production) / false (dev)
  sameSite: 'lax'
  maxAge: 604800 (7 * 24 * 60 * 60 seconds)
  path: /accounts/refresh
```

---

## Domain Layer

### New entity: `RefreshToken`

```
src/domain/accounts/enterprise/entities/refresh-token.ts
```

Props: `userId: UniqueEntityId`, `token: string` (opaque UUID), `expiresAt: Date`, `createdAt: Date`.

Static `create()` factory. No JWT — opaque token is sufficient since DB is the source of truth.

### New repository interface

```
src/domain/accounts/app/repositories/refresh-tokens-repository.ts
```

Methods:
- `findByToken(token: string): Promise<RefreshToken | null>`
- `create(refreshToken: RefreshToken): Promise<void>`
- `delete(refreshToken: RefreshToken): Promise<void>`
- `deleteAllByUserId(userId: string): Promise<void>`

### Modified use case: `AuthenticateWithCredentialsUseCase`

- Receives `RefreshTokensRepository` as new constructor dependency
- Generates opaque refresh token via `crypto.randomUUID()`
- Persists refresh token in DB
- Returns `{ accessToken: string, refreshToken: string, user: User }`

### New use case: `RefreshTokenUseCase`

```
src/domain/accounts/app/use-cases/refresh-token.ts
```

Input: `{ token: string }`  
Output: `Either<UnauthorizedError, { accessToken: string, refreshToken: string }>`

Constructor deps: `RefreshTokensRepository`, `Encrypter`

Steps: find by token → validate expiry → delete old → create new → sign new JWT via `Encrypter`.

### New use case: `SignOutUseCase`

```
src/domain/accounts/app/use-cases/sign-out.ts
```

Input: `{ token: string }`  
Output: `Either<never, void>` (always succeeds — idempotent)

Steps: find by token → if found, delete. If not found, no-op.

---

## Database Schema

Add to `schema.prisma`:

```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}
```

---

## Infrastructure Layer

### New dependency

`@fastify/cookie` is not yet installed. Add it before implementing:

```
pnpm add @fastify/cookie
```

### `app.ts` changes

1. Register `@fastify/cookie` before `@fastify/jwt`
2. Configure `@fastify/jwt` with `cookie: { cookieName: 'access_token', signed: false }`
3. Update CORS: `origin: env.WEB_URL`, `credentials: true` — remove wildcard

### `verify-jwt.ts`

No code change needed. `req.jwtVerify()` reads `access_token` cookie automatically with the new JWT plugin config.

### New infra files

```
src/infra/database/repositories/prisma-refresh-tokens-repository.ts
src/infra/http/utils/set-auth-cookies.ts          ← shared helper for setting both cookies
src/infra/http/controllers/accounts/refresh-token.ts
src/infra/http/controllers/accounts/sign-out.ts
src/infra/http/controllers/accounts/factories/make-refresh-token-use-case.ts
src/infra/http/controllers/accounts/factories/make-sign-out-use-case.ts
```

### `set-auth-cookies.ts`

Centralizes cookie options to avoid duplication across sign-in and refresh controllers:

```ts
setCookies(res: FastifyReply, accessToken: string, refreshToken: string): void
clearCookies(res: FastifyReply): void
```

### Modified: `authenticate-with-credentials.ts` controller

- Remove `token: z.jwt()` from response schema
- Call `setCookies(res, accessToken, refreshToken)`
- Return only `{ user }` in body

### `env/index.ts`

`WEB_URL` already exists. No new env vars needed.

---

## Testing

### Unit tests (in-memory repos, no DB)

**`authenticate-with-credentials.spec.ts`** (update):
- Verify `RefreshToken` is created in `InMemoryRefreshTokensRepository`
- Verify both `accessToken` and `refreshToken` are returned

**`refresh-token.spec.ts`** (new):
- Happy path: old token deleted, new token created, new access token returned
- Token not found → `UnauthorizedError`
- Token expired → `UnauthorizedError`

**`sign-out.spec.ts`** (new):
- Deletes refresh token from DB
- Token not found → no error (idempotent)

### E2E tests

**`sign-in.e2e.spec.ts`** (new/update):
- Response has `Set-Cookie` headers with `access_token` and `refresh_token`
- No `token` field in response body

**`refresh.e2e.spec.ts`** (new):
- Sign in → use refresh cookie → verify new cookies in response
- Old refresh token rejected with 401 after rotation

**`sign-out.e2e.spec.ts`** (new):
- Sign in → sign out → attempt refresh → 401

**Existing authenticated route E2E tests**:
- Replace `Authorization: Bearer <token>` header with cookie injection

---

## Files Changed Summary

| File | Action |
|------|--------|
| `schema.prisma` | Add `RefreshToken` model |
| `src/domain/accounts/enterprise/entities/refresh-token.ts` | Create |
| `src/domain/accounts/app/repositories/refresh-tokens-repository.ts` | Create |
| `src/domain/accounts/app/use-cases/authenticate-with-credentials.ts` | Modify |
| `src/domain/accounts/app/use-cases/refresh-token.ts` | Create |
| `src/domain/accounts/app/use-cases/sign-out.ts` | Create |
| `src/infra/database/repositories/prisma-refresh-tokens-repository.ts` | Create |
| `src/infra/http/utils/set-auth-cookies.ts` | Create |
| `src/infra/http/controllers/accounts/authenticate-with-credentials.ts` | Modify |
| `src/infra/http/controllers/accounts/refresh-token.ts` | Create |
| `src/infra/http/controllers/accounts/sign-out.ts` | Create |
| `src/infra/http/controllers/accounts/factories/make-authenticate-with-credentials-use-case.ts` | Modify |
| `src/infra/http/controllers/accounts/factories/make-refresh-token-use-case.ts` | Create |
| `src/infra/http/controllers/accounts/factories/make-sign-out-use-case.ts` | Create |
| `src/infra/http/controllers/accounts/index.ts` | Modify (register new routes) |
| `src/app.ts` | Modify (cookie plugin, CORS, JWT config) |
| `tests/repositories/in-memory-refresh-tokens-repository.ts` | Create |
