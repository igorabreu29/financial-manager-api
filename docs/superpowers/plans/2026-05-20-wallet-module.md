# Wallet Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Wallet` entity to the `transactions` bounded context so users can group transactions by wallet; every transaction must belong to a wallet.

**Architecture:** Clean Architecture / DDD — domain layer (entity, repository interface, use cases) is fully framework-agnostic. Infrastructure layer (Prisma adapter, mapper) implements the repository port. HTTP layer (Fastify controllers with `verifyJWT`) wires everything together via factory functions. Cascade delete: removing a wallet deletes all its transactions.

**Tech Stack:** TypeScript, Fastify 5, Prisma 7 (PostgreSQL), Zod 4, Vitest, @faker-js/faker

---

## File Map

**Create:**
- `src/domain/transactions/enterprise/entities/wallet.ts`
- `src/domain/transactions/app/repositories/wallets-repository.ts`
- `src/domain/transactions/app/repositories/types/wallet.ts`
- `src/domain/transactions/app/use-case/create-wallet.ts` + `.spec.ts`
- `src/domain/transactions/app/use-case/update-wallet.ts` + `.spec.ts`
- `src/domain/transactions/app/use-case/delete-wallet.ts` + `.spec.ts`
- `src/domain/transactions/app/use-case/fetch-wallets.ts` + `.spec.ts`
- `tests/repositories/in-memory-wallets-repository.ts`
- `tests/factories/make-wallet.ts`
- `src/infra/database/mappers/wallet-mapper.ts`
- `src/infra/database/repositories/wallets-repository-adapter.ts`
- `src/infra/http/presenters/wallet-presenter.ts`
- `src/infra/http/controllers/transactions/create-wallet.ts`
- `src/infra/http/controllers/transactions/update-wallet.ts`
- `src/infra/http/controllers/transactions/delete-wallet.ts`
- `src/infra/http/controllers/transactions/get-wallets.ts`
- `src/infra/http/controllers/transactions/factories/make-create-wallet-use-case.ts`
- `src/infra/http/controllers/transactions/factories/make-update-wallet-use-case.ts`
- `src/infra/http/controllers/transactions/factories/make-delete-wallet-use-case.ts`
- `src/infra/http/controllers/transactions/factories/make-fetch-wallets-use-case.ts`

**Modify:**
- `src/infra/database/prisma/schema.prisma`
- `src/domain/transactions/enterprise/entities/transaction.ts`
- `src/domain/transactions/app/use-case/create-transaction.ts`
- `src/domain/transactions/app/use-case/create-transaction.spec.ts`
- `src/infra/database/mappers/transaction-mapper.ts`
- `src/infra/database/repositories/transactions-repository-adapter.ts`
- `src/infra/http/controllers/transactions/create-transaction.ts`
- `src/infra/http/controllers/transactions/get-transactions.ts`
- `src/infra/http/controllers/transactions/factories/make-create-transaction-use-case.ts`
- `src/infra/http/presenters/transaction-presenter.ts`
- `src/infra/http/controllers/transactions/index.ts`
- `tests/factories/make-transaction.ts`

---

## Task 1: Update Prisma schema and regenerate client

**Files:**
- Modify: `src/infra/database/prisma/schema.prisma`

- [ ] **Step 1: Replace schema.prisma with updated content**

Full file content:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"

  generatedFileExtension = "ts"
  moduleFormat           = "esm"
  importFileExtension    = "ts"
  runtime                = "nodejs"
}

datasource db {
  provider = "postgresql"
}

model User {
  id           String  @id @default(uuid())
  name         String
  email        String
  passwordHash String  @map("password_hash")
  avatarUrl    String? @map("avatar_url")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime? @updatedAt @map("updated_at")

  categories   Category[]
  transactions Transaction[]
  tokens       Token[]
  wallets      Wallet[]

  @@map("users")
}

enum TokenType {
  PASSWORD_RECOVER
}

model Token {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  type      TokenType @default(PASSWORD_RECOVER)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime? @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("tokens")
}

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

model Category {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  name      String
  isActive  Boolean  @default(true) @map("is_active")
  isGlobal  Boolean  @default(false) @map("is_global")
  createdAt DateTime @default(now()) @map("created_at")

  user         User?         @relation(fields: [userId], references: [id], onDelete: SetDefault)
  transactions Transaction[]

  @@map("categories")
}

enum TransactionType {
  INCOME
  OUTCOME
}

model Transaction {
  id          String          @id @default(uuid())
  categoryId  String          @map("category_id")
  userId      String          @map("user_id")
  walletId    String          @map("wallet_id")
  description String
  type        TransactionType
  price       Int
  createdAt   DateTime        @default(now()) @map("created_at")
  updatedAt   DateTime?       @updatedAt @map("updated_at")

  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  wallet   Wallet   @relation(fields: [walletId], references: [id], onDelete: Cascade)

  @@map("transactions")
}
```

- [ ] **Step 2: Push schema to dev DB and regenerate client**

```bash
pnpm prisma db push
pnpm prisma:generate
```

Expected: "Your database is now in sync with your Prisma schema" and client files regenerated in `src/infra/database/generated/prisma/`.

- [ ] **Step 3: Commit**

```bash
git add src/infra/database/prisma/schema.prisma src/infra/database/generated/
git commit -m "chore: add Wallet model to prisma schema and regenerate client"
```

---

## Task 2: Wallet domain entity

**Files:**
- Create: `src/domain/transactions/enterprise/entities/wallet.ts`

- [ ] **Step 1: Create the Wallet entity**

```ts
import { Entity } from "@/core/entities/entity.ts";
import type { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import type { Optional } from "@/core/types/optional.ts";

export interface WalletProps {
	name: string;
	userId: UniqueEntityId;
	description: string | null;
	createdAt: Date;
	updatedAt: Date | null;
}

export class Wallet extends Entity<WalletProps> {
	static create(
		props: Optional<WalletProps, "createdAt" | "updatedAt" | "description">,
		id?: UniqueEntityId
	): Wallet {
		return new Wallet(
			{
				...props,
				description: props.description ?? null,
				createdAt: props.createdAt ?? new Date(),
				updatedAt: props.updatedAt ?? null,
			},
			id
		);
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add src/domain/transactions/enterprise/entities/wallet.ts
git commit -m "feat: add Wallet domain entity"
```

---

## Task 3: Update Transaction entity to include walletId

**Files:**
- Modify: `src/domain/transactions/enterprise/entities/transaction.ts`

- [ ] **Step 1: Add walletId to TransactionProps**

Replace the full file:

```ts
import { Entity } from "@/core/entities/entity.ts";
import type { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import type { Optional } from "@/core/types/optional.ts";

export type TransactionType = "income" | "outcome";

export interface TransactionProps {
	description: string;
	type: TransactionType;
	price: number;
	categoryId: UniqueEntityId;
	userId: UniqueEntityId;
	walletId: UniqueEntityId;
	createdAt: Date;
	updatedAt: Date | null;
}

export class Transaction extends Entity<TransactionProps> {
	static create(
		props: Optional<TransactionProps, "createdAt" | "updatedAt">,
		id?: UniqueEntityId
	) {
		return new Transaction(
			{
				...props,
				createdAt: props.createdAt ?? new Date(),
				updatedAt: props.updatedAt ?? new Date(),
			},
			id
		);
	}
}
```

- [ ] **Step 2: Update make-transaction factory to include walletId**

Replace `tests/factories/make-transaction.ts`:

```ts
import { faker } from "@faker-js/faker";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import {
	Transaction,
	type TransactionProps,
} from "@/domain/transactions/enterprise/entities/transaction.ts";

export function makeTransaction(
	override: Partial<TransactionProps> = {},
	id?: UniqueEntityId
) {
	const transaction = Transaction.create(
		{
			categoryId: new UniqueEntityId(),
			userId: new UniqueEntityId(),
			walletId: new UniqueEntityId(),
			description: faker.lorem.sentence(),
			price: Number(faker.finance.amount()),
			type: "income",
			...override,
		},
		id
	);

	return transaction;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/domain/transactions/enterprise/entities/transaction.ts tests/factories/make-transaction.ts
git commit -m "feat: add walletId to Transaction entity"
```

---

## Task 4: WalletsRepository interface and types

**Files:**
- Create: `src/domain/transactions/app/repositories/wallets-repository.ts`
- Create: `src/domain/transactions/app/repositories/types/wallet.ts`

- [ ] **Step 1: Create the repository types file**

`src/domain/transactions/app/repositories/types/wallet.ts`:

```ts
import type { PaginationParamsResponse } from "@/core/repositories/pagination-params.ts";
import type { Wallet } from "@/domain/transactions/enterprise/entities/wallet.ts";

export interface FindManyWalletsResponse extends PaginationParamsResponse {
	wallets: Wallet[];
}

export interface FindByWalletAndUserIdParams {
	walletId: string;
	userId: string;
}
```

- [ ] **Step 2: Create the repository interface**

`src/domain/transactions/app/repositories/wallets-repository.ts`:

```ts
import type { PaginationParams } from "@/core/repositories/pagination-params.ts";
import type { Wallet } from "@/domain/transactions/enterprise/entities/wallet.ts";
import type {
	FindByWalletAndUserIdParams,
	FindManyWalletsResponse,
} from "./types/wallet.ts";

export interface WalletsRepository {
	findById(id: string): Promise<Wallet | null>;
	findByWalletAndUserId(
		params: FindByWalletAndUserIdParams
	): Promise<Wallet | null>;
	findManyByUserId(
		props: { userId: string },
		pagination: PaginationParams
	): Promise<FindManyWalletsResponse>;
	create(wallet: Wallet): Promise<Wallet>;
	update(wallet: Wallet): Promise<Wallet>;
	delete(wallet: Wallet): Promise<void>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/domain/transactions/app/repositories/wallets-repository.ts src/domain/transactions/app/repositories/types/wallet.ts
git commit -m "feat: add WalletsRepository interface and types"
```

---

## Task 5: Test helpers — InMemoryWalletsRepository and make-wallet factory

**Files:**
- Create: `tests/repositories/in-memory-wallets-repository.ts`
- Create: `tests/factories/make-wallet.ts`

- [ ] **Step 1: Create InMemoryWalletsRepository**

`tests/repositories/in-memory-wallets-repository.ts`:

```ts
import type { PaginationParams } from "@/core/repositories/pagination-params.ts";
import type { WalletsRepository } from "@/domain/transactions/app/repositories/wallets-repository.ts";
import type {
	FindByWalletAndUserIdParams,
	FindManyWalletsResponse,
} from "@/domain/transactions/app/repositories/types/wallet.ts";
import type { Wallet } from "@/domain/transactions/enterprise/entities/wallet.ts";

export class InMemoryWalletsRepository implements WalletsRepository {
	public wallets: Wallet[] = [];

	public async findById(id: string): Promise<Wallet | null> {
		return this.wallets.find(w => w.id.toValue() === id) ?? null;
	}

	public async findByWalletAndUserId({
		walletId,
		userId,
	}: FindByWalletAndUserIdParams): Promise<Wallet | null> {
		return (
			this.wallets.find(
				w =>
					w.id.toValue() === walletId &&
					w.props.userId.toValue() === userId
			) ?? null
		);
	}

	public async findManyByUserId(
		{ userId }: { userId: string },
		pagination: PaginationParams
	): Promise<FindManyWalletsResponse> {
		const userWallets = this.wallets
			.filter(w => w.props.userId.toValue() === userId)
			.sort(
				(a, b) =>
					b.props.createdAt.getTime() - a.props.createdAt.getTime()
			);

		const paginated = userWallets.slice(
			(pagination.page - 1) * pagination.perPage,
			pagination.page * pagination.perPage
		);

		return {
			wallets: paginated,
			totalItems: userWallets.length,
			pages: Math.ceil(userWallets.length / pagination.perPage),
		};
	}

	public async create(wallet: Wallet): Promise<Wallet> {
		this.wallets.push(wallet);
		return wallet;
	}

	public async update(wallet: Wallet): Promise<Wallet> {
		const index = this.wallets.findIndex(w => w.id.equals(wallet.id));
		this.wallets[index] = wallet;
		return wallet;
	}

	public async delete(wallet: Wallet): Promise<void> {
		const index = this.wallets.findIndex(w => w.id.equals(wallet.id));
		this.wallets.splice(index, 1);
	}
}
```

- [ ] **Step 2: Create make-wallet factory**

`tests/factories/make-wallet.ts`:

```ts
import { faker } from "@faker-js/faker";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import {
	Wallet,
	type WalletProps,
} from "@/domain/transactions/enterprise/entities/wallet.ts";

export function makeWallet(
	override: Partial<WalletProps> = {},
	id?: UniqueEntityId
) {
	return Wallet.create(
		{
			name: faker.finance.accountName(),
			userId: new UniqueEntityId(),
			description: null,
			...override,
		},
		id
	);
}
```

- [ ] **Step 3: Commit**

```bash
git add tests/repositories/in-memory-wallets-repository.ts tests/factories/make-wallet.ts
git commit -m "test: add InMemoryWalletsRepository and make-wallet factory"
```

---

## Task 6: create-wallet use case (TDD)

**Files:**
- Create: `src/domain/transactions/app/use-case/create-wallet.spec.ts`
- Create: `src/domain/transactions/app/use-case/create-wallet.ts`

- [ ] **Step 1: Write the failing spec**

`src/domain/transactions/app/use-case/create-wallet.spec.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryWalletsRepository } from "@/repositories/in-memory-wallets-repository.ts";
import { CreateWalletUseCase } from "./create-wallet.ts";

describe("Create Wallet Use Case", () => {
	let walletsRepository: InMemoryWalletsRepository;
	let sut: CreateWalletUseCase;

	beforeEach(() => {
		walletsRepository = new InMemoryWalletsRepository();
		sut = new CreateWalletUseCase(walletsRepository);
	});

	it("should create a wallet", async () => {
		const result = await sut.execute({
			name: "My Wallet",
			description: "Personal finances",
			userId: "user-1",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.wallet.props.name).toBe("My Wallet");
		expect(result.value.wallet.props.description).toBe("Personal finances");
		expect(walletsRepository.wallets).toHaveLength(1);
	});

	it("should create a wallet without description", async () => {
		const result = await sut.execute({
			name: "My Wallet",
			userId: "user-1",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.wallet.props.description).toBeNull();
	});
});
```

- [ ] **Step 2: Run spec to confirm it fails**

```bash
pnpm vitest run src/domain/transactions/app/use-case/create-wallet.spec.ts
```

Expected: FAIL — "Cannot find module './create-wallet.ts'"

- [ ] **Step 3: Implement create-wallet use case**

`src/domain/transactions/app/use-case/create-wallet.ts`:

```ts
import { type Either, success } from "@/core/either.ts";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { Wallet } from "../../enterprise/entities/wallet.ts";
import type { WalletsRepository } from "../repositories/wallets-repository.ts";

interface CreateWalletUseCaseRequest {
	name: string;
	description?: string | null;
	userId: string;
}

type CreateWalletUseCaseResponse = Either<
	null,
	{
		wallet: Wallet;
	}
>;

export class CreateWalletUseCase {
	constructor(private walletsRepository: WalletsRepository) {}

	async execute({
		name,
		description,
		userId,
	}: CreateWalletUseCaseRequest): Promise<CreateWalletUseCaseResponse> {
		const wallet = Wallet.create({
			name,
			description: description ?? null,
			userId: new UniqueEntityId(userId),
		});

		await this.walletsRepository.create(wallet);

		return success({ wallet });
	}
}
```

- [ ] **Step 4: Run spec to confirm it passes**

```bash
pnpm vitest run src/domain/transactions/app/use-case/create-wallet.spec.ts
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add src/domain/transactions/app/use-case/create-wallet.ts src/domain/transactions/app/use-case/create-wallet.spec.ts
git commit -m "feat: add create-wallet use case"
```

---

## Task 7: update-wallet use case (TDD)

**Files:**
- Create: `src/domain/transactions/app/use-case/update-wallet.spec.ts`
- Create: `src/domain/transactions/app/use-case/update-wallet.ts`

- [ ] **Step 1: Write the failing spec**

`src/domain/transactions/app/use-case/update-wallet.spec.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { makeWallet } from "@/factories/make-wallet.ts";
import { InMemoryWalletsRepository } from "@/repositories/in-memory-wallets-repository.ts";
import { UpdateWalletUseCase } from "./update-wallet.ts";

describe("Update Wallet Use Case", () => {
	let walletsRepository: InMemoryWalletsRepository;
	let sut: UpdateWalletUseCase;

	beforeEach(() => {
		walletsRepository = new InMemoryWalletsRepository();
		sut = new UpdateWalletUseCase(walletsRepository);
	});

	it("should return error when wallet does not exist", async () => {
		const result = await sut.execute({
			walletId: "non-existent",
			userId: "user-1",
			name: "Updated",
			description: null,
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should return error when wallet belongs to a different user", async () => {
		const wallet = await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId("user-1") })
		);

		const result = await sut.execute({
			walletId: wallet.id.toValue(),
			userId: "user-2",
			name: "Updated",
			description: null,
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should update wallet name and description", async () => {
		const wallet = await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId("user-1") })
		);

		const result = await sut.execute({
			walletId: wallet.id.toValue(),
			userId: "user-1",
			name: "Updated Name",
			description: "Updated desc",
		});

		expect(result.success()).toBe(true);
		expect(walletsRepository.wallets[0].props.name).toBe("Updated Name");
		expect(walletsRepository.wallets[0].props.description).toBe("Updated desc");
	});

	it("should allow clearing description to null", async () => {
		const wallet = await walletsRepository.create(
			makeWallet({
				userId: new UniqueEntityId("user-1"),
				description: "old desc",
			})
		);

		const result = await sut.execute({
			walletId: wallet.id.toValue(),
			userId: "user-1",
			name: "My Wallet",
			description: null,
		});

		expect(result.success()).toBe(true);
		expect(walletsRepository.wallets[0].props.description).toBeNull();
	});
});
```

- [ ] **Step 2: Run spec to confirm it fails**

```bash
pnpm vitest run src/domain/transactions/app/use-case/update-wallet.spec.ts
```

Expected: FAIL — "Cannot find module './update-wallet.ts'"

- [ ] **Step 3: Implement update-wallet use case**

`src/domain/transactions/app/use-case/update-wallet.ts`:

```ts
import { type Either, failure, success } from "@/core/either.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { Wallet } from "../../enterprise/entities/wallet.ts";
import type { WalletsRepository } from "../repositories/wallets-repository.ts";

interface UpdateWalletUseCaseRequest {
	walletId: string;
	userId: string;
	name: string;
	description: string | null;
}

type UpdateWalletUseCaseResponse = Either<
	ResourceNotFoundError,
	{
		wallet: Wallet;
	}
>;

export class UpdateWalletUseCase {
	constructor(private walletsRepository: WalletsRepository) {}

	async execute({
		walletId,
		userId,
		name,
		description,
	}: UpdateWalletUseCaseRequest): Promise<UpdateWalletUseCaseResponse> {
		const wallet = await this.walletsRepository.findByWalletAndUserId({
			walletId,
			userId,
		});

		if (!wallet) {
			return failure(new ResourceNotFoundError(`Wallet with id: ${walletId}`));
		}

		const updatedWallet = Wallet.create(
			{
				name,
				description,
				userId: wallet.props.userId,
				createdAt: wallet.props.createdAt,
			},
			wallet.id
		);

		await this.walletsRepository.update(updatedWallet);

		return success({ wallet: updatedWallet });
	}
}
```

- [ ] **Step 4: Run spec to confirm it passes**

```bash
pnpm vitest run src/domain/transactions/app/use-case/update-wallet.spec.ts
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/domain/transactions/app/use-case/update-wallet.ts src/domain/transactions/app/use-case/update-wallet.spec.ts
git commit -m "feat: add update-wallet use case"
```

---

## Task 8: delete-wallet use case (TDD)

**Files:**
- Create: `src/domain/transactions/app/use-case/delete-wallet.spec.ts`
- Create: `src/domain/transactions/app/use-case/delete-wallet.ts`

- [ ] **Step 1: Write the failing spec**

`src/domain/transactions/app/use-case/delete-wallet.spec.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { makeWallet } from "@/factories/make-wallet.ts";
import { InMemoryWalletsRepository } from "@/repositories/in-memory-wallets-repository.ts";
import { DeleteWalletUseCase } from "./delete-wallet.ts";

describe("Delete Wallet Use Case", () => {
	let walletsRepository: InMemoryWalletsRepository;
	let sut: DeleteWalletUseCase;

	beforeEach(() => {
		walletsRepository = new InMemoryWalletsRepository();
		sut = new DeleteWalletUseCase(walletsRepository);
	});

	it("should return error when wallet does not exist", async () => {
		const result = await sut.execute({
			walletId: "non-existent",
			userId: "user-1",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should return error when wallet belongs to a different user", async () => {
		const wallet = await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId("user-1") })
		);

		const result = await sut.execute({
			walletId: wallet.id.toValue(),
			userId: "user-2",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should delete the wallet", async () => {
		const wallet = await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId("user-1") })
		);

		const result = await sut.execute({
			walletId: wallet.id.toValue(),
			userId: "user-1",
		});

		expect(result.success()).toBe(true);
		expect(walletsRepository.wallets).toHaveLength(0);
	});
});
```

- [ ] **Step 2: Run spec to confirm it fails**

```bash
pnpm vitest run src/domain/transactions/app/use-case/delete-wallet.spec.ts
```

Expected: FAIL — "Cannot find module './delete-wallet.ts'"

- [ ] **Step 3: Implement delete-wallet use case**

`src/domain/transactions/app/use-case/delete-wallet.ts`:

```ts
import { type Either, failure, success } from "@/core/either.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import type { WalletsRepository } from "../repositories/wallets-repository.ts";

interface DeleteWalletUseCaseRequest {
	walletId: string;
	userId: string;
}

type DeleteWalletUseCaseResponse = Either<ResourceNotFoundError, null>;

export class DeleteWalletUseCase {
	constructor(private walletsRepository: WalletsRepository) {}

	async execute({
		walletId,
		userId,
	}: DeleteWalletUseCaseRequest): Promise<DeleteWalletUseCaseResponse> {
		const wallet = await this.walletsRepository.findByWalletAndUserId({
			walletId,
			userId,
		});

		if (!wallet) {
			return failure(new ResourceNotFoundError(`Wallet with id: ${walletId}`));
		}

		await this.walletsRepository.delete(wallet);

		return success(null);
	}
}
```

- [ ] **Step 4: Run spec to confirm it passes**

```bash
pnpm vitest run src/domain/transactions/app/use-case/delete-wallet.spec.ts
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/domain/transactions/app/use-case/delete-wallet.ts src/domain/transactions/app/use-case/delete-wallet.spec.ts
git commit -m "feat: add delete-wallet use case"
```

---

## Task 9: fetch-wallets use case (TDD)

**Files:**
- Create: `src/domain/transactions/app/use-case/fetch-wallets.spec.ts`
- Create: `src/domain/transactions/app/use-case/fetch-wallets.ts`

- [ ] **Step 1: Write the failing spec**

`src/domain/transactions/app/use-case/fetch-wallets.spec.ts`:

```ts
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { makeWallet } from "@/factories/make-wallet.ts";
import { InMemoryWalletsRepository } from "@/repositories/in-memory-wallets-repository.ts";
import { FetchWalletsUseCase } from "./fetch-wallets.ts";

describe("Fetch Wallets Use Case", () => {
	let walletsRepository: InMemoryWalletsRepository;
	let sut: FetchWalletsUseCase;

	beforeEach(() => {
		walletsRepository = new InMemoryWalletsRepository();
		sut = new FetchWalletsUseCase(walletsRepository);
	});

	it("should return empty list when user has no wallets", async () => {
		const result = await sut.execute({ userId: "user-1", page: 1, perPage: 10 });

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.wallets).toHaveLength(0);
		expect(result.value.totalItems).toBe(0);
	});

	it("should return paginated wallets for user", async () => {
		const userId = randomUUID();

		await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId(userId), createdAt: new Date("2024-01-01") })
		);
		await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId(userId), createdAt: new Date("2024-02-01") })
		);
		await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId(userId), createdAt: new Date("2024-03-01") })
		);

		const result = await sut.execute({ userId, page: 1, perPage: 2 });

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.wallets).toHaveLength(2);
		expect(result.value.totalItems).toBe(3);
		expect(result.value.pages).toBe(2);
	});

	it("should not return wallets from other users", async () => {
		await walletsRepository.create(makeWallet({ userId: new UniqueEntityId("other-user") }));

		const result = await sut.execute({ userId: "user-1", page: 1, perPage: 10 });

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.wallets).toHaveLength(0);
	});
});
```

- [ ] **Step 2: Run spec to confirm it fails**

```bash
pnpm vitest run src/domain/transactions/app/use-case/fetch-wallets.spec.ts
```

Expected: FAIL — "Cannot find module './fetch-wallets.ts'"

- [ ] **Step 3: Implement fetch-wallets use case**

`src/domain/transactions/app/use-case/fetch-wallets.ts`:

```ts
import { type Either, success } from "@/core/either.ts";
import type { Wallet } from "../../enterprise/entities/wallet.ts";
import type { WalletsRepository } from "../repositories/wallets-repository.ts";

interface FetchWalletsUseCaseRequest {
	userId: string;
	page?: number;
	perPage?: number;
}

type FetchWalletsUseCaseResponse = Either<
	null,
	{
		wallets: Wallet[];
		totalItems: number;
		pages: number;
	}
>;

export class FetchWalletsUseCase {
	constructor(private walletsRepository: WalletsRepository) {}

	async execute({
		userId,
		page = 1,
		perPage = 10,
	}: FetchWalletsUseCaseRequest): Promise<FetchWalletsUseCaseResponse> {
		const { wallets, totalItems, pages } =
			await this.walletsRepository.findManyByUserId(
				{ userId },
				{ page, perPage }
			);

		return success({ wallets, totalItems, pages });
	}
}
```

- [ ] **Step 4: Run spec to confirm it passes**

```bash
pnpm vitest run src/domain/transactions/app/use-case/fetch-wallets.spec.ts
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/domain/transactions/app/use-case/fetch-wallets.ts src/domain/transactions/app/use-case/fetch-wallets.spec.ts
git commit -m "feat: add fetch-wallets use case"
```

---

## Task 10: Update create-transaction use case to validate walletId

**Files:**
- Modify: `src/domain/transactions/app/use-case/create-transaction.ts`
- Modify: `src/domain/transactions/app/use-case/create-transaction.spec.ts`

- [ ] **Step 1: Update the spec to cover walletId validation**

Replace `src/domain/transactions/app/use-case/create-transaction.spec.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { makeCategory } from "@/factories/make-category.ts";
import { makeWallet } from "@/factories/make-wallet.ts";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory-categories-repository.ts";
import { InMemoryTransactionsRepository } from "@/repositories/in-memory-transactions-repository.ts";
import { InMemoryWalletsRepository } from "@/repositories/in-memory-wallets-repository.ts";
import { CreateTransactionUseCase } from "./create-transaction.ts";

describe("Create Transaction Use Case", () => {
	let transactionsRepository: InMemoryTransactionsRepository;
	let categoriesRepository: InMemoryCategoriesRepository;
	let walletsRepository: InMemoryWalletsRepository;
	let sut: CreateTransactionUseCase;

	beforeEach(() => {
		transactionsRepository = new InMemoryTransactionsRepository();
		categoriesRepository = new InMemoryCategoriesRepository();
		walletsRepository = new InMemoryWalletsRepository();
		sut = new CreateTransactionUseCase(
			transactionsRepository,
			categoriesRepository,
			walletsRepository
		);
	});

	it("should receive error when category does not exist", async () => {
		const wallet = await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId("user-1") })
		);

		const result = await sut.execute({
			description: "test-description",
			categoryId: "category-1",
			walletId: wallet.id.toValue(),
			userId: "user-1",
			price: 100,
			type: "income",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should receive error when wallet does not exist", async () => {
		const category = await categoriesRepository.create(makeCategory());

		const result = await sut.execute({
			description: "test-description",
			categoryId: category.id.toValue(),
			walletId: "non-existent-wallet",
			userId: category.props.userId?.toValue() ?? "",
			price: 100,
			type: "income",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(ResourceNotFoundError);
	});

	it("should be able to create a transaction", async () => {
		const userId = "user-1";

		const category = await categoriesRepository.create(
			makeCategory({ userId: new UniqueEntityId(userId) })
		);
		const wallet = await walletsRepository.create(
			makeWallet({ userId: new UniqueEntityId(userId) })
		);

		const result = await sut.execute({
			description: "test-description",
			categoryId: category.id.toValue(),
			walletId: wallet.id.toValue(),
			userId,
			price: 100,
			type: "income",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.transaction.props).toMatchObject({
			description: "test-description",
		});
		expect(result.value.transaction.props.walletId.toValue()).toBe(
			wallet.id.toValue()
		);
	});
});
```

- [ ] **Step 2: Run spec to confirm it fails**

```bash
pnpm vitest run src/domain/transactions/app/use-case/create-transaction.spec.ts
```

Expected: FAIL — type errors or wrong argument count

- [ ] **Step 3: Update create-transaction use case**

Replace `src/domain/transactions/app/use-case/create-transaction.ts`:

```ts
import { type Either, failure, success } from "@/core/either.ts";
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import {
	Transaction,
	type TransactionType,
} from "../../enterprise/entities/transaction.ts";
import type { CategoriesRepository } from "../repositories/categories-repository.ts";
import type { TransactionsRepository } from "../repositories/transactions-repository.ts";
import type { WalletsRepository } from "../repositories/wallets-repository.ts";

interface CreateTransactionUseCaseRequest {
	description: string;
	type: TransactionType;
	price: number;
	categoryId: string;
	walletId: string;
	userId: string;
}

type CreateTransactionUseCaseResponse = Either<
	ResourceNotFoundError,
	{
		transaction: Transaction;
	}
>;

export class CreateTransactionUseCase {
	constructor(
		private transactionsRepository: TransactionsRepository,
		private categoriesRepository: CategoriesRepository,
		private walletsRepository: WalletsRepository
	) {}

	async execute({
		categoryId,
		walletId,
		userId,
		description,
		price,
		type,
	}: CreateTransactionUseCaseRequest): Promise<CreateTransactionUseCaseResponse> {
		const category = await this.categoriesRepository.findByCategoryAndUserId({
			categoryId,
			userId,
		});
		if (!category) {
			return failure(
				new ResourceNotFoundError(`Category with id: ${categoryId}`)
			);
		}

		const wallet = await this.walletsRepository.findByWalletAndUserId({
			walletId,
			userId,
		});
		if (!wallet) {
			return failure(new ResourceNotFoundError(`Wallet with id: ${walletId}`));
		}

		const transaction = Transaction.create({
			categoryId: new UniqueEntityId(categoryId),
			walletId: new UniqueEntityId(walletId),
			userId: new UniqueEntityId(userId),
			description,
			price,
			type,
		});

		await this.transactionsRepository.create(transaction);

		return success({ transaction });
	}
}
```

- [ ] **Step 4: Run spec to confirm it passes**

```bash
pnpm vitest run src/domain/transactions/app/use-case/create-transaction.spec.ts
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/domain/transactions/app/use-case/create-transaction.ts src/domain/transactions/app/use-case/create-transaction.spec.ts
git commit -m "feat: add walletId validation to create-transaction use case"
```

---

## Task 11: WalletMapper

**Files:**
- Create: `src/infra/database/mappers/wallet-mapper.ts`

- [ ] **Step 1: Create the mapper**

```ts
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { Wallet } from "@/domain/transactions/enterprise/entities/wallet.ts";

interface WalletPersistance {
	id: string;
	name: string;
	userId: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date | null;
}

export class WalletMapper {
	static toDomain(wallet: WalletPersistance): Wallet {
		return Wallet.create(
			{
				name: wallet.name,
				userId: new UniqueEntityId(wallet.userId),
				description: wallet.description,
				createdAt: wallet.createdAt,
				updatedAt: wallet.updatedAt,
			},
			new UniqueEntityId(wallet.id)
		);
	}

	static toDatabase(wallet: Wallet): WalletPersistance {
		return {
			id: wallet.id.toValue(),
			name: wallet.props.name,
			userId: wallet.props.userId.toValue(),
			description: wallet.props.description,
			createdAt: wallet.props.createdAt,
			updatedAt: wallet.props.updatedAt,
		};
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infra/database/mappers/wallet-mapper.ts
git commit -m "feat: add WalletMapper"
```

---

## Task 12: WalletsRepositoryAdapter

**Files:**
- Create: `src/infra/database/repositories/wallets-repository-adapter.ts`

- [ ] **Step 1: Create the Prisma repository adapter**

```ts
import type { PaginationParams } from "@/core/repositories/pagination-params.ts";
import type { WalletsRepository } from "@/domain/transactions/app/repositories/wallets-repository.ts";
import type {
	FindByWalletAndUserIdParams,
	FindManyWalletsResponse,
} from "@/domain/transactions/app/repositories/types/wallet.ts";
import type { Wallet } from "@/domain/transactions/enterprise/entities/wallet.ts";
import { WalletMapper } from "../mappers/wallet-mapper.ts";
import { prisma } from "../prisma.ts";

export class WalletsRepositoryAdapter implements WalletsRepository {
	public async findById(id: string): Promise<Wallet | null> {
		const wallet = await prisma.wallet.findUnique({ where: { id } });
		if (!wallet) return null;
		return WalletMapper.toDomain(wallet);
	}

	public async findByWalletAndUserId({
		walletId,
		userId,
	}: FindByWalletAndUserIdParams): Promise<Wallet | null> {
		const wallet = await prisma.wallet.findFirst({
			where: { id: walletId, userId },
		});
		if (!wallet) return null;
		return WalletMapper.toDomain(wallet);
	}

	public async findManyByUserId(
		{ userId }: { userId: string },
		pagination: PaginationParams
	): Promise<FindManyWalletsResponse> {
		const wallets = await prisma.wallet.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			take: pagination.perPage,
			skip: (pagination.page - 1) * pagination.perPage,
		});

		const totalItems = await prisma.wallet.count({ where: { userId } });
		const pages = Math.ceil(totalItems / pagination.perPage);

		return { wallets: wallets.map(WalletMapper.toDomain), totalItems, pages };
	}

	public async create(wallet: Wallet): Promise<Wallet> {
		const row = WalletMapper.toDatabase(wallet);
		await prisma.wallet.create({ data: row });
		return wallet;
	}

	public async update(wallet: Wallet): Promise<Wallet> {
		const row = WalletMapper.toDatabase(wallet);
		await prisma.wallet.update({ where: { id: row.id }, data: row });
		return wallet;
	}

	public async delete(wallet: Wallet): Promise<void> {
		await prisma.wallet.delete({ where: { id: wallet.id.toValue() } });
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infra/database/repositories/wallets-repository-adapter.ts
git commit -m "feat: add WalletsRepositoryAdapter"
```

---

## Task 13: Update TransactionMapper and TransactionsRepositoryAdapter

**Files:**
- Modify: `src/infra/database/mappers/transaction-mapper.ts`
- Modify: `src/infra/database/repositories/transactions-repository-adapter.ts`

- [ ] **Step 1: Update TransactionMapper to include walletId**

Replace `src/infra/database/mappers/transaction-mapper.ts`:

```ts
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { Transaction } from "@/domain/transactions/enterprise/entities/transaction.ts";
import type { TransactionType as PrismaTransactionType } from "../generated/prisma/enums.ts";
import { TransactionTypeMapper } from "./transaction-type-mapper.ts";

interface TransactionPersistance {
	id: string;
	description: string;
	type: PrismaTransactionType;
	price: number;
	categoryId: string;
	userId: string;
	walletId: string;
	createdAt: Date;
	updatedAt: Date | null;
}

export class TransactionMapper {
	static toDomain(transaction: TransactionPersistance): Transaction {
		return Transaction.create(
			{
				categoryId: new UniqueEntityId(transaction.categoryId),
				userId: new UniqueEntityId(transaction.userId),
				walletId: new UniqueEntityId(transaction.walletId),
				description: transaction.description,
				price: transaction.price,
				type: TransactionTypeMapper.toDomain(transaction.type),
				createdAt: transaction.createdAt,
				updatedAt: transaction.updatedAt,
			},
			new UniqueEntityId(transaction.id)
		);
	}

	static toDatabase(transaction: Transaction): TransactionPersistance {
		return {
			id: transaction.id.toValue(),
			categoryId: transaction.props.categoryId.toValue(),
			userId: transaction.props.userId.toValue(),
			walletId: transaction.props.walletId.toValue(),
			description: transaction.props.description,
			price: transaction.props.price,
			type: TransactionTypeMapper.toDatabase(transaction.props.type),
			createdAt: transaction.props.createdAt,
			updatedAt: transaction.props.updatedAt,
		};
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infra/database/mappers/transaction-mapper.ts src/infra/database/repositories/transactions-repository-adapter.ts
git commit -m "feat: add walletId to TransactionMapper and adapter"
```

---

## Task 14: WalletPresenter and TransactionPresenter update

**Files:**
- Create: `src/infra/http/presenters/wallet-presenter.ts`
- Modify: `src/infra/http/presenters/transaction-presenter.ts`

- [ ] **Step 1: Create WalletPresenter**

`src/infra/http/presenters/wallet-presenter.ts`:

```ts
import type { Wallet } from "@/domain/transactions/enterprise/entities/wallet.ts";

export class WalletPresenter {
	static toHTTP(wallet: Wallet) {
		return {
			id: wallet.id.toValue(),
			user_id: wallet.props.userId.toValue(),
			name: wallet.props.name,
			description: wallet.props.description,
			created_at: wallet.props.createdAt.toISOString(),
		};
	}
}
```

- [ ] **Step 2: Update TransactionPresenter to include wallet_id**

Replace `src/infra/http/presenters/transaction-presenter.ts`:

```ts
import type { Transaction } from "@/domain/transactions/enterprise/entities/transaction.ts";

export class TransactionPresenter {
	static toHTTP(transaction: Transaction) {
		return {
			id: transaction.id.toValue(),
			wallet_id: transaction.props.walletId.toValue(),
			category_id: transaction.props.categoryId.toValue(),
			user_id: transaction.props.userId.toValue(),
			description: transaction.props.description,
			price: transaction.props.price,
			type: transaction.props.type,
			created_at: transaction.props.createdAt.toISOString(),
		};
	}
}
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/http/presenters/wallet-presenter.ts src/infra/http/presenters/transaction-presenter.ts
git commit -m "feat: add WalletPresenter and wallet_id to TransactionPresenter"
```

---

## Task 15: create-wallet HTTP controller and factory

**Files:**
- Create: `src/infra/http/controllers/transactions/create-wallet.ts`
- Create: `src/infra/http/controllers/transactions/factories/make-create-wallet-use-case.ts`

- [ ] **Step 1: Create the factory**

`src/infra/http/controllers/transactions/factories/make-create-wallet-use-case.ts`:

```ts
import { CreateWalletUseCase } from "@/domain/transactions/app/use-case/create-wallet.ts";
import { WalletsRepositoryAdapter } from "@/infra/database/repositories/wallets-repository-adapter.ts";

export function makeCreateWalletUseCase() {
	const walletsRepository = new WalletsRepositoryAdapter();
	return new CreateWalletUseCase(walletsRepository);
}
```

- [ ] **Step 2: Create the controller**

`src/infra/http/controllers/transactions/create-wallet.ts`:

```ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { WalletPresenter } from "../../presenters/wallet-presenter.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeCreateWalletUseCase } from "./factories/make-create-wallet-use-case.ts";

export const createWallet: FastifyPluginCallbackZod = app => {
	app.post(
		"/wallets",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "Create Wallet",
				tags: ["wallets"],
				body: z.object({
					name: z
						.string()
						.min(3, { error: "Name cannot be less than 3 characters." }),
					description: z.string().optional().nullable(),
				}),
				response: {
					201: z.object({
						wallet: z.object({
							id: z.uuidv4(),
							user_id: z.uuidv4(),
							name: z.string(),
							description: z.string().nullable(),
							created_at: z.string(),
						}),
					}),
				},
			},
		},
		async (req, res) => {
			const payload = req.user;
			const { name, description } = req.body;

			const useCase = makeCreateWalletUseCase();
			const result = await useCase.execute({
				name,
				description,
				userId: payload.sub,
			});

			if (result.failure()) return;

			const { wallet } = result.value;

			return res.status(StatusCode.CREATED).send({
				wallet: WalletPresenter.toHTTP(wallet),
			});
		}
	);
};
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/http/controllers/transactions/create-wallet.ts src/infra/http/controllers/transactions/factories/make-create-wallet-use-case.ts
git commit -m "feat: add create-wallet HTTP controller"
```

---

## Task 16: update-wallet HTTP controller and factory

**Files:**
- Create: `src/infra/http/controllers/transactions/update-wallet.ts`
- Create: `src/infra/http/controllers/transactions/factories/make-update-wallet-use-case.ts`

- [ ] **Step 1: Create the factory**

`src/infra/http/controllers/transactions/factories/make-update-wallet-use-case.ts`:

```ts
import { UpdateWalletUseCase } from "@/domain/transactions/app/use-case/update-wallet.ts";
import { WalletsRepositoryAdapter } from "@/infra/database/repositories/wallets-repository-adapter.ts";

export function makeUpdateWalletUseCase() {
	const walletsRepository = new WalletsRepositoryAdapter();
	return new UpdateWalletUseCase(walletsRepository);
}
```

- [ ] **Step 2: Create the controller**

`src/infra/http/controllers/transactions/update-wallet.ts`:

```ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeUpdateWalletUseCase } from "./factories/make-update-wallet-use-case.ts";

export const updateWallet: FastifyPluginCallbackZod = app => {
	app.put(
		"/wallets/:walletId",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "Update Wallet",
				tags: ["wallets"],
				params: z.object({
					walletId: z.uuidv4({ error: "Invalid UUID." }),
				}),
				body: z.object({
					name: z
						.string()
						.min(3, { error: "Name cannot be less than 3 characters." }),
					description: z.string().optional().nullable(),
				}),
				response: {
					204: z.void(),
				},
			},
		},
		async (req, res) => {
			const payload = req.user;
			const { walletId } = req.params;
			const { name, description } = req.body;

			const useCase = makeUpdateWalletUseCase();
			const result = await useCase.execute({
				walletId,
				userId: payload.sub,
				name,
				description: description ?? null,
			});

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			return res.status(StatusCode.NO_CONTENT).send();
		}
	);
};
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/http/controllers/transactions/update-wallet.ts src/infra/http/controllers/transactions/factories/make-update-wallet-use-case.ts
git commit -m "feat: add update-wallet HTTP controller"
```

---

## Task 17: delete-wallet HTTP controller and factory

**Files:**
- Create: `src/infra/http/controllers/transactions/delete-wallet.ts`
- Create: `src/infra/http/controllers/transactions/factories/make-delete-wallet-use-case.ts`

- [ ] **Step 1: Create the factory**

`src/infra/http/controllers/transactions/factories/make-delete-wallet-use-case.ts`:

```ts
import { DeleteWalletUseCase } from "@/domain/transactions/app/use-case/delete-wallet.ts";
import { WalletsRepositoryAdapter } from "@/infra/database/repositories/wallets-repository-adapter.ts";

export function makeDeleteWalletUseCase() {
	const walletsRepository = new WalletsRepositoryAdapter();
	return new DeleteWalletUseCase(walletsRepository);
}
```

- [ ] **Step 2: Create the controller**

`src/infra/http/controllers/transactions/delete-wallet.ts`:

```ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeDeleteWalletUseCase } from "./factories/make-delete-wallet-use-case.ts";

export const deleteWallet: FastifyPluginCallbackZod = app => {
	app.delete(
		"/wallets/:walletId",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "Delete Wallet",
				tags: ["wallets"],
				params: z.object({
					walletId: z.uuidv4({ error: "Invalid UUID." }),
				}),
				response: {
					204: z.void(),
				},
			},
		},
		async (req, res) => {
			const payload = req.user;
			const { walletId } = req.params;

			const useCase = makeDeleteWalletUseCase();
			const result = await useCase.execute({
				walletId,
				userId: payload.sub,
			});

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			return res.status(StatusCode.NO_CONTENT).send();
		}
	);
};
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/http/controllers/transactions/delete-wallet.ts src/infra/http/controllers/transactions/factories/make-delete-wallet-use-case.ts
git commit -m "feat: add delete-wallet HTTP controller"
```

---

## Task 18: get-wallets HTTP controller and factory

**Files:**
- Create: `src/infra/http/controllers/transactions/get-wallets.ts`
- Create: `src/infra/http/controllers/transactions/factories/make-fetch-wallets-use-case.ts`

- [ ] **Step 1: Create the factory**

`src/infra/http/controllers/transactions/factories/make-fetch-wallets-use-case.ts`:

```ts
import { FetchWalletsUseCase } from "@/domain/transactions/app/use-case/fetch-wallets.ts";
import { WalletsRepositoryAdapter } from "@/infra/database/repositories/wallets-repository-adapter.ts";

export function makeFetchWalletsUseCase() {
	const walletsRepository = new WalletsRepositoryAdapter();
	return new FetchWalletsUseCase(walletsRepository);
}
```

- [ ] **Step 2: Create the controller**

`src/infra/http/controllers/transactions/get-wallets.ts`:

```ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { WalletPresenter } from "../../presenters/wallet-presenter.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeFetchWalletsUseCase } from "./factories/make-fetch-wallets-use-case.ts";

export const getWallets: FastifyPluginCallbackZod = app => {
	app.get(
		"/wallets",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "List Wallets",
				tags: ["wallets"],
				querystring: z.object({
					page: z.string().default("1").transform(Number),
					perPage: z.string().default("10").transform(Number),
				}),
				response: {
					200: z.object({
						wallets: z.array(
							z.object({
								id: z.uuidv4(),
								user_id: z.uuidv4(),
								name: z.string(),
								description: z.string().nullable(),
								created_at: z.string(),
							})
						),
						pages: z.number(),
						totalItems: z.number(),
					}),
				},
			},
		},
		async (req, res) => {
			const payload = req.user;
			const { page, perPage } = req.query;

			const useCase = makeFetchWalletsUseCase();
			const result = await useCase.execute({
				userId: payload.sub,
				page,
				perPage,
			});

			if (result.failure()) return;

			const { wallets, pages, totalItems } = result.value;

			return res.status(StatusCode.OK).send({
				wallets: wallets.map(WalletPresenter.toHTTP),
				pages,
				totalItems,
			});
		}
	);
};
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/http/controllers/transactions/get-wallets.ts src/infra/http/controllers/transactions/factories/make-fetch-wallets-use-case.ts
git commit -m "feat: add get-wallets HTTP controller"
```

---

## Task 19: Update create-transaction controller and factory

**Files:**
- Modify: `src/infra/http/controllers/transactions/create-transaction.ts`
- Modify: `src/infra/http/controllers/transactions/factories/make-create-transaction-use-case.ts`
- Modify: `src/infra/http/controllers/transactions/get-transactions.ts`

- [ ] **Step 1: Update make-create-transaction-use-case factory to inject WalletsRepositoryAdapter**

Replace `src/infra/http/controllers/transactions/factories/make-create-transaction-use-case.ts`:

```ts
import { CreateTransactionUseCase } from "@/domain/transactions/app/use-case/create-transaction.ts";
import { CategoriesRepositoryAdapter } from "@/infra/database/repositories/categories-repository-adapter.ts";
import { TransactionsRepositoryAdapter } from "@/infra/database/repositories/transactions-repository-adapter.ts";
import { WalletsRepositoryAdapter } from "@/infra/database/repositories/wallets-repository-adapter.ts";

export function makeCreateTransactionUseCase() {
	const transactionsRepository = new TransactionsRepositoryAdapter();
	const categoriesRepository = new CategoriesRepositoryAdapter();
	const walletsRepository = new WalletsRepositoryAdapter();
	return new CreateTransactionUseCase(
		transactionsRepository,
		categoriesRepository,
		walletsRepository
	);
}
```

- [ ] **Step 2: Update create-transaction controller — new route and walletId from params**

Replace `src/infra/http/controllers/transactions/create-transaction.ts`:

```ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { TransactionPresenter } from "../../presenters/transaction-presenter.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeCreateTransactionUseCase } from "./factories/make-create-transaction-use-case.ts";

export const createTransaction: FastifyPluginCallbackZod = app => {
	app.post(
		"/wallets/:walletId/categories/:categoryId/transactions",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "Create Transaction",
				tags: ["transactions"],
				params: z.object({
					walletId: z.uuidv4({ error: "Invalid UUID." }),
					categoryId: z.uuidv4({ error: "Invalid UUID." }),
				}),
				body: z.object({
					description: z
						.string()
						.nonempty({ error: "Description cannot be empty!" }),
					type: z.enum(["income", "outcome"]),
					price: z
						.int()
						.positive({ error: "Price should be a positive number!" }),
				}),
				response: {
					201: z.object({
						transaction: z.object({
							id: z.uuidv4(),
							wallet_id: z.uuidv4(),
							user_id: z.uuidv4(),
							category_id: z.uuidv4(),
							description: z.string(),
							price: z.number(),
							type: z.enum(["income", "outcome"]),
							created_at: z.string(),
						}),
					}),
				},
			},
		},
		async (req, res) => {
			const payload = req.user;
			const { walletId, categoryId } = req.params;
			const { price, description, type } = req.body;

			const useCase = makeCreateTransactionUseCase();
			const result = await useCase.execute({
				categoryId,
				walletId,
				description,
				price,
				type,
				userId: payload.sub,
			});

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			const { transaction } = result.value;

			return res.status(StatusCode.CREATED).send({
				transaction: TransactionPresenter.toHTTP(transaction),
			});
		}
	);
};
```

- [ ] **Step 3: Update get-transactions response schema to include wallet_id**

In `src/infra/http/controllers/transactions/get-transactions.ts`, update the response schema inside the `200` object to add `wallet_id`:

```ts
response: {
    200: z.object({
        transactions: z.array(
            z.object({
                id: z.uuidv4(),
                wallet_id: z.uuidv4(),
                user_id: z.uuidv4(),
                category_id: z.uuidv4(),
                description: z.string(),
                price: z.number(),
                type: z.enum(["income", "outcome"]),
                created_at: z.string(),
            })
        ),
        pages: z.number(),
        totalItems: z.number(),
    }),
},
```

Full updated file `src/infra/http/controllers/transactions/get-transactions.ts`:

```ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { verifyJWT } from "../../middlewares/verify-jwt.ts";
import { TransactionPresenter } from "../../presenters/transaction-presenter.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { makeFetchTransactionsUseCase } from "./factories/make-fetch-transactions-use-case.ts";

export const getTransactions: FastifyPluginCallbackZod = app => {
	app.get(
		"/transactions",
		{
			onRequest: [verifyJWT],
			schema: {
				summary: "List transactions",
				tags: ["transactions"],
				querystring: z.object({
					description: z.string().optional(),
					type: z.enum(["income", "outcome"]).optional(),
					page: z.string().default("1").transform(Number),
					perPage: z.string().default("20").transform(Number),
				}),
				response: {
					200: z.object({
						transactions: z.array(
							z.object({
								id: z.uuidv4(),
								wallet_id: z.uuidv4(),
								user_id: z.uuidv4(),
								category_id: z.uuidv4(),
								description: z.string(),
								price: z.number(),
								type: z.enum(["income", "outcome"]),
								created_at: z.string(),
							})
						),
						pages: z.number(),
						totalItems: z.number(),
					}),
				},
			},
		},
		async (req, res) => {
			const payload = req.user;
			const { page, perPage, description, type } = req.query;

			const useCase = makeFetchTransactionsUseCase();
			const result = await useCase.execute({
				userId: payload.sub,
				description,
				type,
				page,
				perPage,
			});

			if (result.failure()) return;

			const { pages, totalItems, transactions } = result.value;

			return res.status(StatusCode.OK).send({
				transactions: transactions.map(TransactionPresenter.toHTTP),
				pages,
				totalItems,
			});
		}
	);
};
```

- [ ] **Step 4: Commit**

```bash
git add src/infra/http/controllers/transactions/create-transaction.ts src/infra/http/controllers/transactions/factories/make-create-transaction-use-case.ts src/infra/http/controllers/transactions/get-transactions.ts
git commit -m "feat: update create-transaction controller with walletId and new route"
```

---

## Task 20: Register wallet controllers and run all tests

**Files:**
- Modify: `src/infra/http/controllers/transactions/index.ts`

- [ ] **Step 1: Register all wallet controllers in transactions/index.ts**

Replace `src/infra/http/controllers/transactions/index.ts`:

```ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { activeCategory } from "./active-category.ts";
import { createCategory } from "./create-category.ts";
import { createTransaction } from "./create-transaction.ts";
import { createWallet } from "./create-wallet.ts";
import { deleteCategory } from "./delete-category.ts";
import { deleteTransaction } from "./delete-transaction.ts";
import { deleteWallet } from "./delete-wallet.ts";
import { disableCategory } from "./disable-category.ts";
import { getActiveCategories } from "./get-active-categories.ts";
import { getCategories } from "./get-categories.ts";
import { getTransactions } from "./get-transactions.ts";
import { getWallets } from "./get-wallets.ts";
import { updateCategory } from "./update-category.ts";
import { updateWallet } from "./update-wallet.ts";

export const transactions: FastifyPluginCallbackZod = app => {
	app.register(getActiveCategories);
	app.register(getCategories);
	app.register(createCategory);
	app.register(updateCategory);
	app.register(activeCategory);
	app.register(disableCategory);
	app.register(deleteCategory);
	app.register(getTransactions);
	app.register(createTransaction);
	app.register(deleteTransaction);
	app.register(createWallet);
	app.register(updateWallet);
	app.register(deleteWallet);
	app.register(getWallets);
};
```

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

Expected: all tests PASS (wallet use case tests + existing tests)

- [ ] **Step 3: Commit**

```bash
git add src/infra/http/controllers/transactions/index.ts
git commit -m "feat: register wallet controllers"
```

---

## Task 21: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add wallets to the bounded context description in CLAUDE.md**

In the "Within each domain bounded context" section, the `transactions/` bounded context now includes `wallet` alongside `category` and `transaction`. Update the Architecture section to mention wallets:

In the line that reads:
```
  transactions/     # Bounded context: categories, transactions
```

Change to:
```
  transactions/     # Bounded context: categories, transactions, wallets
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md to reflect wallet module"
```
