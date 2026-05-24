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

describe("POST /wallets (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("creates a wallet and returns 201", async () => {
		const cookies = await authenticate();
		const name = faker.finance.accountName();

		const response = await app.inject({
			method: "POST",
			url: "/wallets",
			cookies,
			body: { name },
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toMatchObject({
			wallet: {
				id: expect.any(String),
				name,
				description: null,
				created_at: expect.any(String),
			},
		});
	});

	it("creates a wallet with description and returns 201", async () => {
		const cookies = await authenticate();

		const response = await app.inject({
			method: "POST",
			url: "/wallets",
			cookies,
			body: {
				name: faker.finance.accountName(),
				description: "My main wallet",
			},
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().wallet.description).toBe("My main wallet");
	});

	it("returns 400 when name is shorter than 3 characters", async () => {
		const cookies = await authenticate();

		const response = await app.inject({
			method: "POST",
			url: "/wallets",
			cookies,
			body: { name: "AB" },
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 401 without authentication", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/wallets",
			body: { name: faker.finance.accountName() },
		});

		expect(response.statusCode).toBe(401);
	});
});
