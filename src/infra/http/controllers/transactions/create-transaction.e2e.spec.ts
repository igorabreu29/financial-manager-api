import { randomUUID } from "node:crypto";
import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "@/app.ts";

async function authenticate() {
	const email = faker.internet.email();
	const password = "pass123456";

	await app.inject({
		method: "POST",
		url: "/accounts/sign-on",
		body: { name: faker.person.fullName(), email, password },
	});

	const res = await app.inject({
		method: "POST",
		url: "/accounts/sign-in",
		body: { email, password },
	});

	return {
		access_token: res.cookies.find(c => c.name === "access_token")!.value,
	};
}

async function createWalletAndCategory(cookies: { access_token: string }) {
	const walletRes = await app.inject({
		method: "POST",
		url: "/wallets",
		cookies,
		body: { name: faker.finance.accountName() },
	});

	const categoryRes = await app.inject({
		method: "POST",
		url: "/categories",
		cookies,
		body: { name: faker.commerce.department() },
	});

	return {
		walletId: walletRes.json().wallet.id as string,
		categoryId: categoryRes.json().category.id as string,
	};
}

describe("POST /wallets/:walletId/categories/:categoryId/transactions (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("creates a transaction and returns 201", async () => {
		const cookies = await authenticate();
		const { walletId, categoryId } = await createWalletAndCategory(cookies);

		const response = await app.inject({
			method: "POST",
			url: `/wallets/${walletId}/categories/${categoryId}/transactions`,
			cookies,
			body: { description: "Salary", type: "income", price: 5000 },
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toMatchObject({
			transaction: {
				id: expect.any(String),
				wallet_id: walletId,
				category_id: categoryId,
				description: "Salary",
				type: "income",
				price: 5000,
			},
		});
	});

	it("returns 400 when wallet does not exist", async () => {
		const cookies = await authenticate();
		const { categoryId } = await createWalletAndCategory(cookies);

		const response = await app.inject({
			method: "POST",
			url: `/wallets/${randomUUID()}/categories/${categoryId}/transactions`,
			cookies,
			body: { description: "Test", type: "outcome", price: 100 },
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 400 when category does not exist", async () => {
		const cookies = await authenticate();
		const { walletId } = await createWalletAndCategory(cookies);

		const response = await app.inject({
			method: "POST",
			url: `/wallets/${walletId}/categories/${randomUUID()}/transactions`,
			cookies,
			body: { description: "Test", type: "outcome", price: 100 },
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 400 when price is not a positive integer", async () => {
		const cookies = await authenticate();
		const { walletId, categoryId } = await createWalletAndCategory(cookies);

		const response = await app.inject({
			method: "POST",
			url: `/wallets/${walletId}/categories/${categoryId}/transactions`,
			cookies,
			body: { description: "Test", type: "income", price: -50 },
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 400 when type is invalid", async () => {
		const cookies = await authenticate();
		const { walletId, categoryId } = await createWalletAndCategory(cookies);

		const response = await app.inject({
			method: "POST",
			url: `/wallets/${walletId}/categories/${categoryId}/transactions`,
			cookies,
			body: { description: "Test", type: "invalid", price: 100 },
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 401 without authentication", async () => {
		const response = await app.inject({
			method: "POST",
			url: `/wallets/${randomUUID()}/categories/${randomUUID()}/transactions`,
			body: { description: "Test", type: "income", price: 100 },
		});

		expect(response.statusCode).toBe(401);
	});
});
