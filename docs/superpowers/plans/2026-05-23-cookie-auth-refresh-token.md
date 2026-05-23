# Cookie Auth + Refresh Token Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current body-based JWT response with HttpOnly cookie-based access + refresh tokens, including token rotation and secure sign-out.

**Architecture:** Access token (15min JWT) and refresh token (7-day opaque UUID) are both set as HttpOnly `SameSite=Lax` cookies. Refresh tokens are stored in a new `refresh_tokens` DB table and rotated on every use. CSRF protection comes from `SameSite=Lax` + strict CORS `origin`.

**Tech Stack:** Fastify 5, `@fastify/jwt` v10, `@fastify/cookie` (new), Prisma 7, Vitest, Supertest

---

## File Map

| File | Action |
|------|--------|
| `src/infra/database/prisma/schema.prisma` | Add `RefreshToken` model |
| `src/core/errors/enums/domain-code.ts` | Add `INVALID_REFRESH_TOKEN` |
| `src/domain/accounts/app/use-cases/errors/invalid-refresh-token-error.ts` | Create |
| `src/domain/accounts/enterprise/entities/refresh-token.ts` | Create |
| `src/domain/accounts/app/repositories/refresh-tokens-repository.ts` | Create |
| `tests/repositories/in-memory-refresh-tokens-repository.ts` | Create |
| `tests/factories/make-refresh-token.ts` | Create |
| `src/domain/accounts/app/use-cases/authenticate-with-credentials.ts` | Modify |
| `src/domain/accounts/app/use-cases/authenticate-with-credentials.spec.ts` | Modify |
| `src/domain/accounts/app/use-cases/refresh-token.ts` | Create |
| `src/domain/accounts/app/use-cases/refresh-token.spec.ts` | Create |
| `src/domain/accounts/app/use-cases/sign-out.ts` | Create |
| `src/domain/accounts/app/use-cases/sign-out.spec.ts` | Create |
| `src/infra/database/mappers/refresh-token-mapper.ts` | Create |
| `src/infra/database/repositories/prisma-refresh-tokens-repository.ts` | Create |
| `src/infra/http/utils/set-auth-cookies.ts` | Create |
| `src/app.ts` | Modify (cookie plugin, CORS, JWT config) |
| `src/infra/http/errors/dispatch-error.ts` | Modify (add InvalidRefreshTokenError) |
| `src/infra/http/controllers/accounts/authenticate-with-credentials.ts` | Modify |
| `src/infra/http/controllers/accounts/factories/make-authenticate-with-credentials-use-case.ts` | Modify |
| `src/infra/http/controllers/accounts/refresh-token.ts` | Create |
| `src/infra/http/controllers/accounts/factories/make-refresh-token-use-case.ts` | Create |
| `src/infra/http/controllers/accounts/sign-out.ts` | Create |
| `src/infra/http/controllers/accounts/factories/make-sign-out-use-case.ts` | Create |
| `src/infra/http/controllers/accounts/index.ts` | Modify (register new routes) |
| `vitest.e2e.config.ts` | Create |
| `src/infra/http/controllers/accounts/sign-in.e2e.spec.ts` | Create |
| `src/infra/http/controllers/accounts/refresh-token.e2e.spec.ts` | Create |
| `src/infra/http/controllers/accounts/sign-out.e2e.spec.ts` | Create |

---

## Task 1: Install @fastify/cookie + Update Prisma Schema

**Files:**
- Modify: `src/infra/database/prisma/schema.prisma`

- [ ] **Step 1: Install @fastify/cookie**

```bash
pnpm add @fastify/cookie
```

Expected output: package added to `dependencies` in `package.json`.

- [ ] **Step 2: Add RefreshToken model to schema.prisma**

Open `src/infra/database/prisma/schema.prisma` and add the following model after the `Token` model (around line 47):

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

Also add `refreshTokens RefreshToken[]` to the `User` model's relation fields:

```prisma
model User {
  // ... existing fields ...
  categories    Category[]
  transactions  Transaction[]
  tokens        Token[]
  wallets       Wallet[]
  refreshTokens RefreshToken[]

  @@map("users")
}
```

- [ ] **Step 3: Regenerate Prisma client**

```bash
pnpm prisma:generate
```

Expected output: `✔ Generated Prisma Client` with no errors. The `RefreshToken` model is now available in the generated client.

- [ ] **Step 4: Commit**

```bash
git add src/infra/database/prisma/schema.prisma package.json pnpm-lock.yaml
git commit -m "feat: add @fastify/cookie and RefreshToken schema model"
```

---

## Task 2: Domain Layer — RefreshToken Entity + Error

**Files:**
- Modify: `src/core/errors/enums/domain-code.ts`
- Create: `src/domain/accounts/app/use-cases/errors/invalid-refresh-token-error.ts`
- Create: `src/domain/accounts/enterprise/entities/refresh-token.ts`

- [ ] **Step 1: Add INVALID_REFRESH_TOKEN to DomainCode enum**

Edit `src/core/errors/enums/domain-code.ts`:

```ts
export enum DomainCode {
	RESOURCE_ALREADY_EXISTS_ERROR = "RESOURCE_ALREADY_EXISTS_ERROR",
	RESOURCE_NOT_FOUND_ERROR = "RESOURCE_NOT_FOUND_ERROR",
	INVALID_CATEGORY_ERROR = "INVALID_CATEGORY_ERROR",
	INVALID_CODE_ERROR = "INVALID_CODE_ERROR",
	PASSWORDS_DONT_MATCH = "PASSWORDS_DONT_MATCH",
	DUPLICATE_GLOBAL_CATEGORY = "DUPLICATE_GLOBAL_CATEGORY",
	WRONG_CREDENTIALS_ERROR = "WRONG_CREDENTIALS_ERROR",
	INVALID_REFRESH_TOKEN = "INVALID_REFRESH_TOKEN",
}
```

- [ ] **Step 2: Create InvalidRefreshTokenError**

Create `src/domain/accounts/app/use-cases/errors/invalid-refresh-token-error.ts`:

```ts
import { DomainError } from "@/core/errors/domain-error.ts";
import { DomainCode } from "@/core/errors/enums/domain-code.ts";

export class InvalidRefreshTokenError extends DomainError {
	constructor() {
		super("Invalid or expired refresh token.", DomainCode.INVALID_REFRESH_TOKEN);
	}
}
```

- [ ] **Step 3: Create RefreshToken entity**

Create `src/domain/accounts/enterprise/entities/refresh-token.ts`:

```ts
import { Entity } from "@/core/entities/entity.ts";
import type { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import type { Optional } from "@/core/types/optional.ts";

export interface RefreshTokenProps {
	userId: UniqueEntityId;
	token: string;
	expiresAt: Date;
	createdAt: Date;
}

export class RefreshToken extends Entity<RefreshTokenProps> {
	static create(
		props: Optional<RefreshTokenProps, "createdAt">,
		id?: UniqueEntityId
	) {
		return new RefreshToken(
			{
				...props,
				createdAt: props.createdAt ?? new Date(),
			},
			id
		);
	}
}
```

- [ ] **Step 4: Commit**

```bash
git add src/core/errors/enums/domain-code.ts \
  src/domain/accounts/app/use-cases/errors/invalid-refresh-token-error.ts \
  src/domain/accounts/enterprise/entities/refresh-token.ts
git commit -m "feat: add RefreshToken entity and InvalidRefreshTokenError"
```

---

## Task 3: Repository Interface + In-Memory Repo + Factory

**Files:**
- Create: `src/domain/accounts/app/repositories/refresh-tokens-repository.ts`
- Create: `tests/repositories/in-memory-refresh-tokens-repository.ts`
- Create: `tests/factories/make-refresh-token.ts`

- [ ] **Step 1: Create repository interface**

Create `src/domain/accounts/app/repositories/refresh-tokens-repository.ts`:

```ts
import type { RefreshToken } from "../../enterprise/entities/refresh-token.ts";

export interface RefreshTokensRepository {
	findByToken(token: string): Promise<RefreshToken | null>;
	create(refreshToken: RefreshToken): Promise<void>;
	delete(refreshToken: RefreshToken): Promise<void>;
	deleteAllByUserId(userId: string): Promise<void>;
}
```

- [ ] **Step 2: Create in-memory repository**

Create `tests/repositories/in-memory-refresh-tokens-repository.ts`:

```ts
import type { RefreshTokensRepository } from "@/domain/accounts/app/repositories/refresh-tokens-repository.ts";
import type { RefreshToken } from "@/domain/accounts/enterprise/entities/refresh-token.ts";

export class InMemoryRefreshTokensRepository
	implements RefreshTokensRepository
{
	public items: RefreshToken[] = [];

	async findByToken(token: string): Promise<RefreshToken | null> {
		return this.items.find(item => item.props.token === token) ?? null;
	}

	async create(refreshToken: RefreshToken): Promise<void> {
		this.items.push(refreshToken);
	}

	async delete(refreshToken: RefreshToken): Promise<void> {
		const index = this.items.findIndex(item => item.equals(refreshToken));
		this.items.splice(index, 1);
	}

	async deleteAllByUserId(userId: string): Promise<void> {
		this.items = this.items.filter(
			item => item.props.userId.toValue() !== userId
		);
	}
}
```

- [ ] **Step 3: Create factory function**

Create `tests/factories/make-refresh-token.ts`:

```ts
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import {
	RefreshToken,
	type RefreshTokenProps,
} from "@/domain/accounts/enterprise/entities/refresh-token.ts";

export function makeRefreshToken(
	override: Partial<RefreshTokenProps> = {},
	id?: UniqueEntityId
): RefreshToken {
	return RefreshToken.create(
		{
			userId: new UniqueEntityId(),
			token: "fake-refresh-token-uuid",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			...override,
		},
		id
	);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/domain/accounts/app/repositories/refresh-tokens-repository.ts \
  tests/repositories/in-memory-refresh-tokens-repository.ts \
  tests/factories/make-refresh-token.ts
git commit -m "feat: add RefreshTokensRepository interface and in-memory implementation"
```

---

## Task 4: Update AuthenticateWithCredentials Use Case + Spec

**Files:**
- Modify: `src/domain/accounts/app/use-cases/authenticate-with-credentials.ts`
- Modify: `src/domain/accounts/app/use-cases/authenticate-with-credentials.spec.ts`

- [ ] **Step 1: Update the use case**

Replace the entire contents of `src/domain/accounts/app/use-cases/authenticate-with-credentials.ts`:

```ts
import { randomUUID } from "node:crypto";
import { type Either, failure, success } from "@/core/either.ts";
import type { User } from "../../enterprise/entities/user.ts";
import { RefreshToken } from "../../enterprise/entities/refresh-token.ts";
import type { Encrypter } from "../cryptography/encrypter.ts";
import type { Hasher } from "../cryptography/hasher.ts";
import type { RefreshTokensRepository } from "../repositories/refresh-tokens-repository.ts";
import type { UsersRepository } from "../repositories/users-repository.ts";
import { WrongCredentialsError } from "./errors/wrong-credentials-error.ts";

interface AuthenticateWithCredentialsUseCaseRequest {
	email: string;
	password: string;
}

type AuthenticateWithCredentialsUseCaseResponse = Either<
	WrongCredentialsError,
	{
		accessToken: string;
		refreshToken: string;
		user: User;
	}
>;

export class AuthenticateWithCredentialsUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private hasher: Hasher,
		private encrypter: Encrypter,
		private refreshTokensRepository: RefreshTokensRepository
	) {}

	public async execute({
		email,
		password,
	}: AuthenticateWithCredentialsUseCaseRequest): Promise<AuthenticateWithCredentialsUseCaseResponse> {
		const user = await this.usersRepository.findByEmail(email);
		if (!user) return failure(new WrongCredentialsError());

		const passwordsMatch = await this.hasher.compare(
			password,
			user.props.passwordHash
		);
		if (!passwordsMatch) return failure(new WrongCredentialsError());

		const accessToken = this.encrypter.encrypt({
			sub: user.id.toValue(),
		});

		const refreshTokenValue = randomUUID();
		const refreshToken = RefreshToken.create({
			userId: user.id,
			token: refreshTokenValue,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		});

		await this.refreshTokensRepository.create(refreshToken);

		return success({
			accessToken,
			refreshToken: refreshTokenValue,
			user,
		});
	}
}
```

- [ ] **Step 2: Run the existing spec to confirm it now fails**

```bash
pnpm vitest run src/domain/accounts/app/use-cases/authenticate-with-credentials.spec.ts
```

Expected: FAIL — `sut` constructor is missing `refreshTokensRepository`, and `result.value.token` no longer exists.

- [ ] **Step 3: Update the spec**

Replace the entire contents of `src/domain/accounts/app/use-cases/authenticate-with-credentials.spec.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { FakeEncrypter } from "@/cryptography/fake-encrypter.ts";
import { FakeHasher } from "@/cryptography/fake-hasher.ts";
import { makeUser } from "@/factories/make-user.ts";
import { InMemoryRefreshTokensRepository } from "@/repositories/in-memory-refresh-tokens-repository.ts";
import { InMemoryUsersRepository } from "@/repositories/in-memory-users-repository.ts";
import { AuthenticateWithCredentialsUseCase } from "./authenticate-with-credentials.ts";
import { WrongCredentialsError } from "./errors/wrong-credentials-error.ts";

describe("Authenticate With Credentials Use Case", async () => {
	let usersRepository: InMemoryUsersRepository;
	let refreshTokensRepository: InMemoryRefreshTokensRepository;
	let hasher: FakeHasher;
	let encrypter: FakeEncrypter;
	let sut: AuthenticateWithCredentialsUseCase;

	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		refreshTokensRepository = new InMemoryRefreshTokensRepository();
		hasher = new FakeHasher();
		encrypter = new FakeEncrypter();
		sut = new AuthenticateWithCredentialsUseCase(
			usersRepository,
			hasher,
			encrypter,
			refreshTokensRepository
		);
	});

	it("should receive error when user does not exist", async () => {
		const result = await sut.execute({
			email: "not-found",
			password: "",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(WrongCredentialsError);
	});

	it("should receive error when passwords are not equals", async () => {
		const user = await usersRepository.create(
			makeUser({ passwordHash: "password-hasher" })
		);

		const result = await sut.execute({
			email: user.props.email,
			password: "password2",
		});

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(WrongCredentialsError);
	});

	it("should authenticate user and create refresh token", async () => {
		const user = await usersRepository.create(
			makeUser({ passwordHash: "password-hasher" })
		);

		const result = await sut.execute({
			email: user.props.email,
			password: "password",
		});

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.accessToken).toBeDefined();
		expect(result.value.refreshToken).toBeDefined();
		expect(result.value.user.id).toEqual(user.id);
		expect(refreshTokensRepository.items).toHaveLength(1);
		expect(refreshTokensRepository.items[0].props.userId).toEqual(user.id);
	});
});
```

- [ ] **Step 4: Run the spec to confirm it passes**

```bash
pnpm vitest run src/domain/accounts/app/use-cases/authenticate-with-credentials.spec.ts
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/accounts/app/use-cases/authenticate-with-credentials.ts \
  src/domain/accounts/app/use-cases/authenticate-with-credentials.spec.ts
git commit -m "feat: update AuthenticateWithCredentials to create refresh token"
```

---

## Task 5: RefreshTokenUseCase + Spec

**Files:**
- Create: `src/domain/accounts/app/use-cases/refresh-token.ts`
- Create: `src/domain/accounts/app/use-cases/refresh-token.spec.ts`

- [ ] **Step 1: Write the failing spec first**

Create `src/domain/accounts/app/use-cases/refresh-token.spec.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { FakeEncrypter } from "@/cryptography/fake-encrypter.ts";
import { makeRefreshToken } from "@/factories/make-refresh-token.ts";
import { InMemoryRefreshTokensRepository } from "@/repositories/in-memory-refresh-tokens-repository.ts";
import { InvalidRefreshTokenError } from "./errors/invalid-refresh-token-error.ts";
import { RefreshTokenUseCase } from "./refresh-token.ts";

describe("Refresh Token Use Case", () => {
	let refreshTokensRepository: InMemoryRefreshTokensRepository;
	let encrypter: FakeEncrypter;
	let sut: RefreshTokenUseCase;

	beforeEach(() => {
		refreshTokensRepository = new InMemoryRefreshTokensRepository();
		encrypter = new FakeEncrypter();
		sut = new RefreshTokenUseCase(refreshTokensRepository, encrypter);
	});

	it("should return error when refresh token is not found", async () => {
		const result = await sut.execute({ token: "non-existent-token" });

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidRefreshTokenError);
	});

	it("should return error when refresh token is expired", async () => {
		const expired = makeRefreshToken({
			expiresAt: new Date(Date.now() - 1000),
		});
		await refreshTokensRepository.create(expired);

		const result = await sut.execute({ token: expired.props.token });

		expect(result.failure()).toBe(true);
		expect(result.value).toBeInstanceOf(InvalidRefreshTokenError);
	});

	it("should rotate refresh token and return new access token", async () => {
		const existing = makeRefreshToken({
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		});
		await refreshTokensRepository.create(existing);

		const result = await sut.execute({ token: existing.props.token });

		expect(result.success()).toBe(true);

		if (result.failure()) return;

		expect(result.value.accessToken).toBeDefined();
		expect(result.value.refreshToken).toBeDefined();
		expect(result.value.refreshToken).not.toBe(existing.props.token);
		expect(refreshTokensRepository.items).toHaveLength(1);
		expect(refreshTokensRepository.items[0].props.token).toBe(
			result.value.refreshToken
		);
	});
});
```

- [ ] **Step 2: Run the spec to confirm it fails**

```bash
pnpm vitest run src/domain/accounts/app/use-cases/refresh-token.spec.ts
```

Expected: FAIL — `Cannot find module './refresh-token.ts'`.

- [ ] **Step 3: Implement the use case**

Create `src/domain/accounts/app/use-cases/refresh-token.ts`:

```ts
import { randomUUID } from "node:crypto";
import { type Either, failure, success } from "@/core/either.ts";
import { RefreshToken } from "../../enterprise/entities/refresh-token.ts";
import type { Encrypter } from "../cryptography/encrypter.ts";
import type { RefreshTokensRepository } from "../repositories/refresh-tokens-repository.ts";
import { InvalidRefreshTokenError } from "./errors/invalid-refresh-token-error.ts";

interface RefreshTokenUseCaseRequest {
	token: string;
}

type RefreshTokenUseCaseResponse = Either<
	InvalidRefreshTokenError,
	{
		accessToken: string;
		refreshToken: string;
	}
>;

export class RefreshTokenUseCase {
	constructor(
		private refreshTokensRepository: RefreshTokensRepository,
		private encrypter: Encrypter
	) {}

	public async execute({
		token,
	}: RefreshTokenUseCaseRequest): Promise<RefreshTokenUseCaseResponse> {
		const existingToken = await this.refreshTokensRepository.findByToken(token);

		if (!existingToken) return failure(new InvalidRefreshTokenError());

		if (existingToken.props.expiresAt < new Date()) {
			await this.refreshTokensRepository.delete(existingToken);
			return failure(new InvalidRefreshTokenError());
		}

		await this.refreshTokensRepository.delete(existingToken);

		const newRefreshTokenValue = randomUUID();
		const newRefreshToken = RefreshToken.create({
			userId: existingToken.props.userId,
			token: newRefreshTokenValue,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		});

		await this.refreshTokensRepository.create(newRefreshToken);

		const accessToken = this.encrypter.encrypt({
			sub: existingToken.props.userId.toValue(),
		});

		return success({ accessToken, refreshToken: newRefreshTokenValue });
	}
}
```

- [ ] **Step 4: Run the spec to confirm it passes**

```bash
pnpm vitest run src/domain/accounts/app/use-cases/refresh-token.spec.ts
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/accounts/app/use-cases/refresh-token.ts \
  src/domain/accounts/app/use-cases/refresh-token.spec.ts
git commit -m "feat: add RefreshTokenUseCase with token rotation"
```

---

## Task 6: SignOutUseCase + Spec

**Files:**
- Create: `src/domain/accounts/app/use-cases/sign-out.ts`
- Create: `src/domain/accounts/app/use-cases/sign-out.spec.ts`

- [ ] **Step 1: Write the failing spec first**

Create `src/domain/accounts/app/use-cases/sign-out.spec.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { makeRefreshToken } from "@/factories/make-refresh-token.ts";
import { InMemoryRefreshTokensRepository } from "@/repositories/in-memory-refresh-tokens-repository.ts";
import { SignOutUseCase } from "./sign-out.ts";

describe("Sign Out Use Case", () => {
	let refreshTokensRepository: InMemoryRefreshTokensRepository;
	let sut: SignOutUseCase;

	beforeEach(() => {
		refreshTokensRepository = new InMemoryRefreshTokensRepository();
		sut = new SignOutUseCase(refreshTokensRepository);
	});

	it("should delete refresh token on sign out", async () => {
		const refreshToken = makeRefreshToken();
		await refreshTokensRepository.create(refreshToken);

		await sut.execute({ token: refreshToken.props.token });

		expect(refreshTokensRepository.items).toHaveLength(0);
	});

	it("should not throw when refresh token does not exist (idempotent)", async () => {
		await expect(
			sut.execute({ token: "non-existent-token" })
		).resolves.not.toThrow();
	});
});
```

- [ ] **Step 2: Run the spec to confirm it fails**

```bash
pnpm vitest run src/domain/accounts/app/use-cases/sign-out.spec.ts
```

Expected: FAIL — `Cannot find module './sign-out.ts'`.

- [ ] **Step 3: Implement the use case**

Create `src/domain/accounts/app/use-cases/sign-out.ts`:

```ts
import type { RefreshTokensRepository } from "../repositories/refresh-tokens-repository.ts";

interface SignOutUseCaseRequest {
	token: string;
}

export class SignOutUseCase {
	constructor(private refreshTokensRepository: RefreshTokensRepository) {}

	public async execute({ token }: SignOutUseCaseRequest): Promise<void> {
		const refreshToken = await this.refreshTokensRepository.findByToken(token);
		if (!refreshToken) return;
		await this.refreshTokensRepository.delete(refreshToken);
	}
}
```

- [ ] **Step 4: Run the spec to confirm it passes**

```bash
pnpm vitest run src/domain/accounts/app/use-cases/sign-out.spec.ts
```

Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/accounts/app/use-cases/sign-out.ts \
  src/domain/accounts/app/use-cases/sign-out.spec.ts
git commit -m "feat: add SignOutUseCase"
```

---

## Task 7: Prisma Mapper + Repository Adapter

**Files:**
- Create: `src/infra/database/mappers/refresh-token-mapper.ts`
- Create: `src/infra/database/repositories/prisma-refresh-tokens-repository.ts`

- [ ] **Step 1: Create the mapper**

Create `src/infra/database/mappers/refresh-token-mapper.ts`:

```ts
import { UniqueEntityId } from "@/core/entities/unique-entity-id.ts";
import { RefreshToken } from "@/domain/accounts/enterprise/entities/refresh-token.ts";

interface RefreshTokenPersistence {
	id: string;
	userId: string;
	token: string;
	expiresAt: Date;
	createdAt: Date;
}

export class RefreshTokenMapper {
	static toDomain(raw: RefreshTokenPersistence): RefreshToken {
		return RefreshToken.create(
			{
				userId: new UniqueEntityId(raw.userId),
				token: raw.token,
				expiresAt: raw.expiresAt,
				createdAt: raw.createdAt,
			},
			new UniqueEntityId(raw.id)
		);
	}

	static toDatabase(refreshToken: RefreshToken): RefreshTokenPersistence {
		return {
			id: refreshToken.id.toValue(),
			userId: refreshToken.props.userId.toValue(),
			token: refreshToken.props.token,
			expiresAt: refreshToken.props.expiresAt,
			createdAt: refreshToken.props.createdAt,
		};
	}
}
```

- [ ] **Step 2: Create the Prisma adapter**

Create `src/infra/database/repositories/prisma-refresh-tokens-repository.ts`:

```ts
import type { RefreshTokensRepository } from "@/domain/accounts/app/repositories/refresh-tokens-repository.ts";
import type { RefreshToken } from "@/domain/accounts/enterprise/entities/refresh-token.ts";
import { RefreshTokenMapper } from "../mappers/refresh-token-mapper.ts";
import { prisma } from "../prisma.ts";

export class PrismaRefreshTokensRepository implements RefreshTokensRepository {
	async findByToken(token: string): Promise<RefreshToken | null> {
		const raw = await prisma.refreshToken.findUnique({ where: { token } });
		if (!raw) return null;
		return RefreshTokenMapper.toDomain(raw);
	}

	async create(refreshToken: RefreshToken): Promise<void> {
		const data = RefreshTokenMapper.toDatabase(refreshToken);
		await prisma.refreshToken.create({ data });
	}

	async delete(refreshToken: RefreshToken): Promise<void> {
		await prisma.refreshToken.delete({
			where: { id: refreshToken.id.toValue() },
		});
	}

	async deleteAllByUserId(userId: string): Promise<void> {
		await prisma.refreshToken.deleteMany({ where: { userId } });
	}
}
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/database/mappers/refresh-token-mapper.ts \
  src/infra/database/repositories/prisma-refresh-tokens-repository.ts
git commit -m "feat: add RefreshToken Prisma mapper and repository adapter"
```

---

## Task 8: Cookie Utility + Update app.ts

**Files:**
- Create: `src/infra/http/utils/set-auth-cookies.ts`
- Modify: `src/app.ts`

- [ ] **Step 1: Create the cookie utility**

Create `src/infra/http/utils/set-auth-cookies.ts`:

```ts
import type { FastifyReply } from "fastify";
import { env } from "@/infra/env/index.ts";

const isProduction = env.NODE_ENV === "production";

export function setCookies(
	res: FastifyReply,
	accessToken: string,
	refreshToken: string
): void {
	res
		.setCookie("access_token", accessToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: "lax",
			maxAge: 15 * 60,
			path: "/",
		})
		.setCookie("refresh_token", refreshToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: "lax",
			maxAge: 7 * 24 * 60 * 60,
			path: "/accounts/refresh",
		});
}

export function clearCookies(res: FastifyReply): void {
	res
		.clearCookie("access_token", { path: "/" })
		.clearCookie("refresh_token", { path: "/accounts/refresh" });
}
```

- [ ] **Step 2: Update app.ts**

Replace the entire contents of `src/app.ts`:

```ts
import fastifyCookie from "@fastify/cookie";
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
import { accounts } from "./infra/http/controllers/accounts/index.ts";
import { healthCheck } from "./infra/http/controllers/health.ts";
import { transactions } from "./infra/http/controllers/transactions/index.ts";
import { loggerConfig } from "./infra/http/logger/logger-config.ts";
import requestContextPlugin from "./infra/http/plugins/request-context-plugin.ts";

export const app = fastify({
	logger: loggerConfig(),
}).withTypeProvider<ZodTypeProvider>();
app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.setErrorHandler(errorHandler);

app.register(requestContextPlugin);

app.register(fastifyCookie);

app.register(fastifyCors, {
	origin: env.WEB_URL,
	credentials: true,
	methods: ["GET", "PATCH", "POST", "OPTIONS", "PUT", "DELETE"],
	allowedHeaders: ["Content-Type", "Authorization"],
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
	cookie: {
		cookieName: "access_token",
		signed: false,
	},
});

await app.register(import("@fastify/swagger"), {
	openapi: {
		info: {
			title: "Financial manager Api",
			version: "1.0.0",
		},
		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "access_token",
				},
			},
		},
		security: [{ cookieAuth: [] }],
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

- [ ] **Step 3: Commit**

```bash
git add src/infra/http/utils/set-auth-cookies.ts src/app.ts
git commit -m "feat: register @fastify/cookie, update CORS to strict origin and JWT cookie config"
```

---

## Task 9: Update dispatch-error.ts

**Files:**
- Modify: `src/infra/http/errors/dispatch-error.ts`

- [ ] **Step 1: Add InvalidRefreshTokenError mapping**

Replace the entire contents of `src/infra/http/errors/dispatch-error.ts`:

```ts
import { ResourceAlreadyExistsError } from "@/core/errors/resource-already-exists-error.ts";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error.ts";
import { InvalidCodeError } from "@/domain/accounts/app/use-cases/errors/invalid-code-error.ts";
import { InvalidRefreshTokenError } from "@/domain/accounts/app/use-cases/errors/invalid-refresh-token-error.ts";
import { PasswordsDontMatch } from "@/domain/accounts/app/use-cases/errors/passwords-dont-match.ts";
import { WrongCredentialsError } from "@/domain/accounts/app/use-cases/errors/wrong-credentials-error.ts";
import { InvalidCategoryError } from "@/domain/transactions/enterprise/entities/errors/invalid-category-error.ts";
import { BadRequestError } from "./bad-request-error.ts";
import { ConflictError } from "./conflict-error.ts";
import { UnauthorizedError } from "./unauthorized-error.ts";

export function dispatchError(error: Error) {
	const errorClassName = error.constructor.name;

	if ([InvalidRefreshTokenError.name].includes(errorClassName)) {
		return new UnauthorizedError(error.message);
	}

	if (
		[
			ResourceNotFoundError.name,
			InvalidCategoryError.name,
			InvalidCodeError.name,
		].includes(errorClassName)
	) {
		return new BadRequestError(error.message);
	}

	if (
		[
			WrongCredentialsError.name,
			PasswordsDontMatch.name,
			ResourceAlreadyExistsError.name,
		].includes(errorClassName)
	) {
		return new ConflictError(error.message);
	}

	return new Error();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infra/http/errors/dispatch-error.ts
git commit -m "feat: map InvalidRefreshTokenError to UnauthorizedError in dispatch-error"
```

---

## Task 10: Update authenticate-with-credentials Controller + Factory

**Files:**
- Modify: `src/infra/http/controllers/accounts/authenticate-with-credentials.ts`
- Modify: `src/infra/http/controllers/accounts/factories/make-authenticate-with-credentials-use-case.ts`

- [ ] **Step 1: Update the controller**

Replace the entire contents of `src/infra/http/controllers/accounts/authenticate-with-credentials.ts`:

```ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { UserPresenter } from "../../presenters/user-presenter.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { setCookies } from "../../utils/set-auth-cookies.ts";
import { makeAuthenticateWithCredentialsUseCase } from "./factories/make-authenticate-with-credentials-use-case.ts";

export const authenticateWithCredentials: FastifyPluginCallbackZod = app => {
	app.post(
		"/sign-in",
		{
			schema: {
				summary: "Authenticate user",
				tags: ["accounts"],
				body: z.object({
					email: z.email({ error: "Invalid e-mail format." }),
					password: z
						.string()
						.min(6, {
							error: "The password must be greater or equal 6 characters.",
						})
						.max(50, {
							error: "The password must be less or equal 50 characters.",
						}),
				}),
				response: {
					201: z.object({
						user: z.object({
							id: z.uuidv4(),
							name: z.string(),
							email: z.email(),
							avatar_url: z.url().nullable(),
							created_at: z.string(),
						}),
					}),
				},
			},
		},
		async (req, res) => {
			const { email, password } = req.body;

			const useCase = makeAuthenticateWithCredentialsUseCase();
			const result = await useCase.execute({ email, password });

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			const { user, accessToken, refreshToken } = result.value;

			setCookies(res, accessToken, refreshToken);

			return res.status(StatusCode.CREATED).send({
				user: UserPresenter.toHTTP(user),
			});
		}
	);
};
```

- [ ] **Step 2: Update the factory**

Replace the entire contents of `src/infra/http/controllers/accounts/factories/make-authenticate-with-credentials-use-case.ts`:

```ts
import { AuthenticateWithCredentialsUseCase } from "@/domain/accounts/app/use-cases/authenticate-with-credentials.ts";
import { BcryptHasher } from "@/infra/cryptography/bcrypt-hasher.ts";
import { JWTEncrypter } from "@/infra/cryptography/jwt-encrypter.ts";
import { PrismaRefreshTokensRepository } from "@/infra/database/repositories/prisma-refresh-tokens-repository.ts";
import { UsersRepositoryAdapter } from "@/infra/database/repositories/users-repository-adapter.ts";

export function makeAuthenticateWithCredentialsUseCase() {
	const usersRepository = new UsersRepositoryAdapter();
	const hasher = new BcryptHasher();
	const encrypter = new JWTEncrypter();
	const refreshTokensRepository = new PrismaRefreshTokensRepository();

	return new AuthenticateWithCredentialsUseCase(
		usersRepository,
		hasher,
		encrypter,
		refreshTokensRepository
	);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/http/controllers/accounts/authenticate-with-credentials.ts \
  src/infra/http/controllers/accounts/factories/make-authenticate-with-credentials-use-case.ts
git commit -m "feat: update sign-in controller to set auth cookies instead of returning token in body"
```

---

## Task 11: Create refresh-token Controller + Factory

**Files:**
- Create: `src/infra/http/controllers/accounts/refresh-token.ts`
- Create: `src/infra/http/controllers/accounts/factories/make-refresh-token-use-case.ts`

- [ ] **Step 1: Create the factory**

Create `src/infra/http/controllers/accounts/factories/make-refresh-token-use-case.ts`:

```ts
import { RefreshTokenUseCase } from "@/domain/accounts/app/use-cases/refresh-token.ts";
import { JWTEncrypter } from "@/infra/cryptography/jwt-encrypter.ts";
import { PrismaRefreshTokensRepository } from "@/infra/database/repositories/prisma-refresh-tokens-repository.ts";

export function makeRefreshTokenUseCase() {
	const refreshTokensRepository = new PrismaRefreshTokensRepository();
	const encrypter = new JWTEncrypter();

	return new RefreshTokenUseCase(refreshTokensRepository, encrypter);
}
```

- [ ] **Step 2: Create the controller**

Create `src/infra/http/controllers/accounts/refresh-token.ts`:

```ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { dispatchError } from "../../errors/dispatch-error.ts";
import { StatusCode } from "../../utils/status-code.ts";
import { setCookies } from "../../utils/set-auth-cookies.ts";
import { makeRefreshTokenUseCase } from "./factories/make-refresh-token-use-case.ts";

export const refreshToken: FastifyPluginCallbackZod = app => {
	app.post(
		"/refresh",
		{
			schema: {
				summary: "Refresh access token",
				tags: ["accounts"],
				response: {
					200: z.object({}),
				},
			},
		},
		async (req, res) => {
			const token = req.cookies.refresh_token ?? "";

			const useCase = makeRefreshTokenUseCase();
			const result = await useCase.execute({ token });

			if (result.failure()) {
				throw dispatchError(result.value);
			}

			const { accessToken, refreshToken: newRefreshToken } = result.value;

			setCookies(res, accessToken, newRefreshToken);

			return res.status(StatusCode.OK).send({});
		}
	);
};
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/http/controllers/accounts/refresh-token.ts \
  src/infra/http/controllers/accounts/factories/make-refresh-token-use-case.ts
git commit -m "feat: add refresh-token controller"
```

---

## Task 12: Create sign-out Controller + Factory

**Files:**
- Create: `src/infra/http/controllers/accounts/sign-out.ts`
- Create: `src/infra/http/controllers/accounts/factories/make-sign-out-use-case.ts`

- [ ] **Step 1: Create the factory**

Create `src/infra/http/controllers/accounts/factories/make-sign-out-use-case.ts`:

```ts
import { SignOutUseCase } from "@/domain/accounts/app/use-cases/sign-out.ts";
import { PrismaRefreshTokensRepository } from "@/infra/database/repositories/prisma-refresh-tokens-repository.ts";

export function makeSignOutUseCase() {
	const refreshTokensRepository = new PrismaRefreshTokensRepository();
	return new SignOutUseCase(refreshTokensRepository);
}
```

- [ ] **Step 2: Create the controller**

Create `src/infra/http/controllers/accounts/sign-out.ts`:

```ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import z from "zod";
import { StatusCode } from "../../utils/status-code.ts";
import { clearCookies } from "../../utils/set-auth-cookies.ts";
import { makeSignOutUseCase } from "./factories/make-sign-out-use-case.ts";

export const signOut: FastifyPluginCallbackZod = app => {
	app.post(
		"/sign-out",
		{
			schema: {
				summary: "Sign out",
				tags: ["accounts"],
				response: {
					200: z.object({}),
				},
			},
		},
		async (req, res) => {
			const token = req.cookies.refresh_token ?? "";

			const useCase = makeSignOutUseCase();
			await useCase.execute({ token });

			clearCookies(res);

			return res.status(StatusCode.OK).send({});
		}
	);
};
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/http/controllers/accounts/sign-out.ts \
  src/infra/http/controllers/accounts/factories/make-sign-out-use-case.ts
git commit -m "feat: add sign-out controller"
```

---

## Task 13: Update accounts/index.ts

**Files:**
- Modify: `src/infra/http/controllers/accounts/index.ts`

- [ ] **Step 1: Register the new routes**

Replace the entire contents of `src/infra/http/controllers/accounts/index.ts`:

```ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { authenticateWithCredentials } from "./authenticate-with-credentials.ts";
import { refreshToken } from "./refresh-token.ts";
import { registerUser } from "./register-user.ts";
import { requestCode } from "./request-code-to-change-password.ts";
import { resetPassword } from "./reset-password.ts";
import { signOut } from "./sign-out.ts";

export const accounts: FastifyPluginCallbackZod = app => {
	app.register(registerUser);
	app.register(authenticateWithCredentials);
	app.register(requestCode);
	app.register(resetPassword);
	app.register(refreshToken);
	app.register(signOut);
};
```

- [ ] **Step 2: Run all unit tests to verify nothing is broken**

```bash
pnpm test
```

Expected: all unit tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/infra/http/controllers/accounts/index.ts
git commit -m "feat: register refresh-token and sign-out routes"
```

---

## Task 14: E2E Config + Sign-in E2E Test

**Files:**
- Create: `vitest.e2e.config.ts`
- Create: `src/infra/http/controllers/accounts/sign-in.e2e.spec.ts`

- [ ] **Step 1: Create E2E vitest config**

Create `vitest.e2e.config.ts` at the project root:

```ts
import swc from "unplugin-swc";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		tsConfigPaths(),
		swc.vite({ module: { type: "es6" } }),
	],
	test: {
		setupFiles: ["./tests/setup-e2e.ts"],
		include: ["**/*.e2e.spec.ts"],
	},
});
```

- [ ] **Step 2: Add E2E test script to package.json**

In `package.json`, add to the `scripts` section:

```json
"test:e2e": "vitest run --config vitest.e2e.config.ts"
```

- [ ] **Step 3: Write the sign-in E2E test**

Create `src/infra/http/controllers/accounts/sign-in.e2e.spec.ts`:

```ts
import { hash } from "bcryptjs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { app } from "@/app.ts";
import { prisma } from "@/infra/database/prisma.ts";

describe("Sign In (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("should set access_token and refresh_token cookies on successful sign in", async () => {
		const passwordHash = await hash("password123", 1);

		await prisma.user.create({
			data: {
				name: "John Doe",
				email: "john@example.com",
				passwordHash,
			},
		});

		const response = await app.inject({
			method: "POST",
			url: "/accounts/sign-in",
			payload: {
				email: "john@example.com",
				password: "password123",
			},
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toHaveProperty("user");
		expect(response.json()).not.toHaveProperty("token");

		const cookies = response.cookies;
		const accessTokenCookie = cookies.find(c => c.name === "access_token");
		const refreshTokenCookie = cookies.find(c => c.name === "refresh_token");

		expect(accessTokenCookie).toBeDefined();
		expect(accessTokenCookie?.httpOnly).toBe(true);
		expect(accessTokenCookie?.sameSite).toBe("Lax");

		expect(refreshTokenCookie).toBeDefined();
		expect(refreshTokenCookie?.httpOnly).toBe(true);
		expect(refreshTokenCookie?.sameSite).toBe("Lax");
		expect(refreshTokenCookie?.path).toBe("/accounts/refresh");
	});

	it("should return 409 on wrong credentials", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/accounts/sign-in",
			payload: {
				email: "wrong@example.com",
				password: "wrongpassword",
			},
		});

		expect(response.statusCode).toBe(409);
	});
});
```

- [ ] **Step 4: Start test DB and run E2E test**

```bash
pnpm compose:up
pnpm test:e2e --reporter=verbose 2>&1 | grep -E "sign-in|PASS|FAIL|✓|✗"
```

Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add vitest.e2e.config.ts package.json \
  src/infra/http/controllers/accounts/sign-in.e2e.spec.ts
git commit -m "feat: add E2E config and sign-in E2E tests"
```

---

## Task 15: Refresh + Sign-out E2E Tests

**Files:**
- Create: `src/infra/http/controllers/accounts/refresh-token.e2e.spec.ts`
- Create: `src/infra/http/controllers/accounts/sign-out.e2e.spec.ts`

- [ ] **Step 1: Create the refresh E2E test**

Create `src/infra/http/controllers/accounts/refresh-token.e2e.spec.ts`:

```ts
import { hash } from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "@/app.ts";
import { prisma } from "@/infra/database/prisma.ts";

async function signIn(email: string, password: string) {
	const response = await app.inject({
		method: "POST",
		url: "/accounts/sign-in",
		payload: { email, password },
	});
	return response;
}

describe("Refresh Token (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("should issue new cookies on valid refresh token", async () => {
		const passwordHash = await hash("password123", 1);
		await prisma.user.create({
			data: { name: "Jane Doe", email: "jane@example.com", passwordHash },
		});

		const signInResponse = await signIn("jane@example.com", "password123");
		const refreshCookie = signInResponse.cookies.find(
			c => c.name === "refresh_token"
		);

		expect(refreshCookie).toBeDefined();

		const refreshResponse = await app.inject({
			method: "POST",
			url: "/accounts/refresh",
			headers: {
				Cookie: `refresh_token=${refreshCookie!.value}`,
			},
		});

		expect(refreshResponse.statusCode).toBe(200);

		const newAccessTokenCookie = refreshResponse.cookies.find(
			c => c.name === "access_token"
		);
		const newRefreshTokenCookie = refreshResponse.cookies.find(
			c => c.name === "refresh_token"
		);

		expect(newAccessTokenCookie).toBeDefined();
		expect(newRefreshTokenCookie).toBeDefined();
		expect(newRefreshTokenCookie!.value).not.toBe(refreshCookie!.value);
	});

	it("should return 401 when refresh token is already rotated (reuse detection)", async () => {
		const passwordHash = await hash("password456", 1);
		await prisma.user.create({
			data: { name: "Bob", email: "bob@example.com", passwordHash },
		});

		const signInResponse = await signIn("bob@example.com", "password456");
		const refreshCookie = signInResponse.cookies.find(
			c => c.name === "refresh_token"
		);

		// Use the token once (rotates it)
		await app.inject({
			method: "POST",
			url: "/accounts/refresh",
			headers: { Cookie: `refresh_token=${refreshCookie!.value}` },
		});

		// Try to reuse the old token
		const reuseResponse = await app.inject({
			method: "POST",
			url: "/accounts/refresh",
			headers: { Cookie: `refresh_token=${refreshCookie!.value}` },
		});

		expect(reuseResponse.statusCode).toBe(401);
	});

	it("should return 401 on invalid refresh token", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/accounts/refresh",
			headers: { Cookie: "refresh_token=not-a-real-token" },
		});

		expect(response.statusCode).toBe(401);
	});
});
```

- [ ] **Step 2: Create the sign-out E2E test**

Create `src/infra/http/controllers/accounts/sign-out.e2e.spec.ts`:

```ts
import { hash } from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "@/app.ts";
import { prisma } from "@/infra/database/prisma.ts";

describe("Sign Out (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("should clear cookies and invalidate refresh token on sign out", async () => {
		const passwordHash = await hash("password123", 1);
		await prisma.user.create({
			data: { name: "Alice", email: "alice@example.com", passwordHash },
		});

		const signInResponse = await app.inject({
			method: "POST",
			url: "/accounts/sign-in",
			payload: { email: "alice@example.com", password: "password123" },
		});

		const refreshCookie = signInResponse.cookies.find(
			c => c.name === "refresh_token"
		);

		const signOutResponse = await app.inject({
			method: "POST",
			url: "/accounts/sign-out",
			headers: {
				Cookie: `refresh_token=${refreshCookie!.value}`,
			},
		});

		expect(signOutResponse.statusCode).toBe(200);

		// Verify refresh token is now invalid
		const refreshAfterSignOut = await app.inject({
			method: "POST",
			url: "/accounts/refresh",
			headers: {
				Cookie: `refresh_token=${refreshCookie!.value}`,
			},
		});

		expect(refreshAfterSignOut.statusCode).toBe(401);
	});

	it("should return 200 even when no refresh token cookie is present (idempotent)", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/accounts/sign-out",
		});

		expect(response.statusCode).toBe(200);
	});
});
```

- [ ] **Step 3: Run all E2E tests**

```bash
pnpm test:e2e --reporter=verbose
```

Expected: all E2E tests in all three files PASS.

- [ ] **Step 4: Run unit tests one final time to confirm nothing is broken**

```bash
pnpm test
```

Expected: all unit tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/infra/http/controllers/accounts/refresh-token.e2e.spec.ts \
  src/infra/http/controllers/accounts/sign-out.e2e.spec.ts
git commit -m "feat: add refresh and sign-out E2E tests"
```

---

## Done

All tasks complete. The auth system now:
- Returns `access_token` (15min) and `refresh_token` (7 days) as HttpOnly `SameSite=Lax` cookies
- Rotates refresh tokens on every use (old token deleted, new one issued)
- Invalidates sessions on sign-out
- Is protected against CSRF via `SameSite=Lax` + strict `WEB_URL` CORS origin
- Is protected against XSS via HttpOnly cookies
