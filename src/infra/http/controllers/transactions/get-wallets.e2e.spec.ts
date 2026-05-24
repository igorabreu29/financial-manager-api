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

describe("GET /wallets (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("returns wallets for the authenticated user with pagination metadata", async () => {
		const cookies = await authenticate();
		const name = faker.finance.accountName();

		await app.inject({
			method: "POST",
			url: "/wallets",
			cookies,
			body: { name },
		});

		const response = await app.inject({
			method: "GET",
			url: "/wallets",
			cookies,
		});

		expect(response.statusCode).toBe(200);
		const { wallets, pages, totalItems } = response.json();
		expect(Array.isArray(wallets)).toBe(true);
		expect(wallets.some((w: { name: string }) => w.name === name)).toBe(true);
		expect(typeof pages).toBe("number");
		expect(typeof totalItems).toBe("number");
	});

	it("returns empty list when user has no wallets", async () => {
		const cookies = await authenticate();

		const response = await app.inject({
			method: "GET",
			url: "/wallets",
			cookies,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().wallets).toEqual([]);
		expect(response.json().totalItems).toBe(0);
	});

	it("returns 401 without authentication", async () => {
		const response = await app.inject({ method: "GET", url: "/wallets" });
		expect(response.statusCode).toBe(401);
	});
});
