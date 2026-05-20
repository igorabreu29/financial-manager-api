# Wallet Module Design

**Date:** 2026-05-20
**Status:** Approved

## Overview

Add a `Wallet` entity to the `transactions` bounded context. Wallets group transactions per user. Every transaction must belong to a wallet. Deleting a wallet cascade-deletes its transactions.

---

## Domain Layer

### Wallet Entity

**File:** `src/domain/transactions/enterprise/entities/wallet.ts`

Props:
- `name: string` — required
- `userId: UniqueEntityId` — required
- `description: string | null` — optional
- `createdAt: Date`
- `updatedAt: Date | null`

`static create()` returns `Wallet` directly (no `Either` — no domain invariants beyond type safety; format validation stays in Zod at the HTTP layer).

### Transaction Entity Update

**File:** `src/domain/transactions/enterprise/entities/transaction.ts`

Add `walletId: UniqueEntityId` to `TransactionProps`. Field is required.

### Wallets Repository Interface

**File:** `src/domain/transactions/app/repositories/wallets-repository.ts`

```ts
interface WalletsRepository {
  findById(id: string): Promise<Wallet | null>
  findByWalletAndUserId(params: { walletId: string; userId: string }): Promise<Wallet | null>
  findManyByUserId(props: { userId: string }, pagination: PaginationParams): Promise<FindManyWalletsResponse>
  create(wallet: Wallet): Promise<Wallet>
  update(wallet: Wallet): Promise<Wallet>
  delete(wallet: Wallet): Promise<void>
}
```

**File:** `src/domain/transactions/app/repositories/types/wallet.ts`

```ts
interface FindManyWalletsResponse extends PaginationParamsResponse {
  wallets: Wallet[]
}
```

### Use Cases

All in `src/domain/transactions/app/use-case/`.

| File | Request | Success | Possible Error |
|---|---|---|---|
| `create-wallet.ts` | `name, description?, userId` | `{ wallet }` | — |
| `update-wallet.ts` | `walletId, userId, name, description?` | `{ wallet }` | `ResourceNotFoundError` |
| `delete-wallet.ts` | `walletId, userId` | `{}` | `ResourceNotFoundError` |
| `fetch-wallets.ts` | `userId, page` | `{ wallets, total, page }` | — |

`update-wallet` and `delete-wallet` use `findByWalletAndUserId` to ensure ownership before mutating.

### create-transaction Update

**File:** `src/domain/transactions/app/use-case/create-transaction.ts`

Add `walletId: string` to request. Before creating, call `walletsRepository.findByWalletAndUserId({ walletId, userId })` — return `ResourceNotFoundError` if not found.

---

## Infrastructure Layer

### Prisma Schema

**File:** `src/infra/database/prisma/schema.prisma`

New model:

```prisma
model Wallet {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  name        String
  description String?
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime? @updatedAt @map("updated_at")

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@map("wallets")
}
```

`Transaction` model additions:
```prisma
walletId String  @map("wallet_id")
wallet   Wallet  @relation(fields: [walletId], references: [id], onDelete: Cascade)
```

`User` model addition:
```prisma
wallets Wallet[]
```

### New Infra Files

- `src/infra/database/mappers/wallet-mapper.ts` — converts between Prisma `Wallet` model and domain `Wallet` entity
- `src/infra/database/repositories/wallets-repository-adapter.ts` — Prisma implementation of `WalletsRepository`

### Updated Infra Files

- `src/infra/database/mappers/transaction-mapper.ts` — include `walletId` mapping
- `src/infra/database/repositories/transactions-repository-adapter.ts` — include `walletId` in create and findMany queries

---

## HTTP Layer

### New Controllers

All in `src/infra/http/controllers/transactions/`, all protected by `verifyJWT`.

| File | Method | Route | Body / Params |
|---|---|---|---|
| `create-wallet.ts` | POST | `/wallets` | body: `{ name, description? }` |
| `update-wallet.ts` | PUT | `/wallets/:walletId` | body: `{ name, description? }` |
| `delete-wallet.ts` | DELETE | `/wallets/:walletId` | — |
| `get-wallets.ts` | GET | `/wallets` | query: `{ page? }` |

Each controller has a corresponding `factories/make-*-use-case.ts`.

### Updated Controller

`create-transaction.ts`: route changes to `/wallets/:walletId/categories/:categoryId/transactions`. `walletId` comes from params.

### Presenter

**File:** `src/infra/http/presenters/wallet-presenter.ts`

Output shape:
```ts
{ id, user_id, name, description, created_at }
```

### transactions/index.ts

Register all four new wallet controllers.

---

## Testing

### Test Helpers

- `tests/repositories/in-memory-wallets-repository.ts` — in-memory implementation of `WalletsRepository`
- `tests/factories/make-wallet.ts` — factory using `@faker-js/faker`

### Unit Test Specs

| Spec | Key scenarios |
|---|---|
| `create-wallet.spec.ts` | creates wallet successfully |
| `update-wallet.spec.ts` | updates successfully; fails if wallet not found or belongs to different user |
| `delete-wallet.spec.ts` | deletes successfully; fails if wallet not found or belongs to different user |
| `fetch-wallets.spec.ts` | returns paginated list; returns empty list when no wallets |
| `create-transaction.spec.ts` (updated) | fails when walletId does not exist or belongs to different user |

All unit tests use in-memory repositories and no real DB or network calls.
