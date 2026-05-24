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

async function createTransaction(
	cookies: { access_token: string },
	overrides: {
		description?: string;
		type?: "income" | "outcome";
		price?: number;
	} = {}
) {
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

	const walletId = walletRes.json().wallet.id as string;
	const categoryId = categoryRes.json().category.id as string;

	await app.inject({
		method: "POST",
		url: `/wallets/${walletId}/categories/${categoryId}/transactions`,
		cookies,
		body: {
			description: overrides.description ?? faker.commerce.productName(),
			type: overrides.type ?? "income",
			price: overrides.price ?? 1000,
		},
	});
}

describe("GET /transactions (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("returns transactions with pagination metadata", async () => {
		const cookies = await authenticate();

		await createTransaction(cookies);

		const response = await app.inject({
			method: "GET",
			url: "/transactions",
			cookies,
		});

		expect(response.statusCode).toBe(200);
		const { transactions, pages, totalItems } = response.json();
		expect(Array.isArray(transactions)).toBe(true);
		expect(transactions.length).toBeGreaterThanOrEqual(1);
		expect(typeof pages).toBe("number");
		expect(typeof totalItems).toBe("number");
	});

	it("filters by type", async () => {
		const cookies = await authenticate();

		await createTransaction(cookies, { type: "income" });
		await createTransaction(cookies, { type: "outcome" });

		const response = await app.inject({
			method: "GET",
			url: "/transactions?type=income",
			cookies,
		});

		expect(response.statusCode).toBe(200);
		const { transactions } = response.json();
		expect(
			transactions.every((t: { type: string }) => t.type === "income")
		).toBe(true);
	});

	it("returns empty list when user has no transactions", async () => {
		const cookies = await authenticate();

		const response = await app.inject({
			method: "GET",
			url: "/transactions",
			cookies,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().totalItems).toBe(0);
	});

	it("returns 401 without authentication", async () => {
		const response = await app.inject({ method: "GET", url: "/transactions" });
		expect(response.statusCode).toBe(401);
	});
});
