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

describe("PUT /wallets/:walletId (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("updates wallet and returns 204", async () => {
		const cookies = await authenticate();

		const createRes = await app.inject({
			method: "POST",
			url: "/wallets",
			cookies,
			body: { name: faker.finance.accountName() },
		});
		const walletId = createRes.json().wallet.id as string;

		const response = await app.inject({
			method: "PUT",
			url: `/wallets/${walletId}`,
			cookies,
			body: { name: "Updated Wallet", description: "New description" },
		});

		expect(response.statusCode).toBe(204);
	});

	it("returns 400 when wallet does not exist", async () => {
		const cookies = await authenticate();

		const response = await app.inject({
			method: "PUT",
			url: `/wallets/${randomUUID()}`,
			cookies,
			body: { name: "New Name" },
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 400 when name is shorter than 3 characters", async () => {
		const cookies = await authenticate();

		const createRes = await app.inject({
			method: "POST",
			url: "/wallets",
			cookies,
			body: { name: faker.finance.accountName() },
		});
		const walletId = createRes.json().wallet.id as string;

		const response = await app.inject({
			method: "PUT",
			url: `/wallets/${walletId}`,
			cookies,
			body: { name: "AB" },
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 401 without authentication", async () => {
		const response = await app.inject({
			method: "PUT",
			url: `/wallets/${randomUUID()}`,
			body: { name: "New Name" },
		});

		expect(response.statusCode).toBe(401);
	});
});
