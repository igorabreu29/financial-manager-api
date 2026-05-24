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

async function createTransaction(cookies: { access_token: string }) {
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

	const txRes = await app.inject({
		method: "POST",
		url: `/wallets/${walletId}/categories/${categoryId}/transactions`,
		cookies,
		body: {
			description: faker.commerce.productName(),
			type: "income",
			price: 1000,
		},
	});

	return txRes.json().transaction.id as string;
}

describe("DELETE /transactions/:transactionId (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("deletes a transaction and returns 204", async () => {
		const cookies = await authenticate();
		const transactionId = await createTransaction(cookies);

		const response = await app.inject({
			method: "DELETE",
			url: `/transactions/${transactionId}`,
			cookies,
		});

		expect(response.statusCode).toBe(204);
	});

	it("returns 400 when transaction does not exist", async () => {
		const cookies = await authenticate();

		const response = await app.inject({
			method: "DELETE",
			url: `/transactions/${randomUUID()}`,
			cookies,
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 401 without authentication", async () => {
		const response = await app.inject({
			method: "DELETE",
			url: `/transactions/${randomUUID()}`,
		});

		expect(response.statusCode).toBe(401);
	});
});
