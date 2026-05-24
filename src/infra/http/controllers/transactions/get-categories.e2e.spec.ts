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

describe("GET /categories (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("returns categories for the authenticated user", async () => {
		const cookies = await authenticate();
		const name = faker.commerce.department();

		await app.inject({
			method: "POST",
			url: "/categories",
			cookies,
			body: { name },
		});

		const response = await app.inject({
			method: "GET",
			url: "/categories",
			cookies,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().categories).toEqual(
			expect.arrayContaining([expect.objectContaining({ name })])
		);
	});

	it("filters categories by name", async () => {
		const cookies = await authenticate();
		const name = `unique-${faker.commerce.department()}`;

		await app.inject({
			method: "POST",
			url: "/categories",
			cookies,
			body: { name },
		});

		const response = await app.inject({
			method: "GET",
			url: `/categories?name=${encodeURIComponent(name)}`,
			cookies,
		});

		expect(response.statusCode).toBe(200);
		const { categories } = response.json();
		expect(
			categories.every((c: { name: string }) => c.name.includes(name))
		).toBe(true);
	});

	it("returns 401 without authentication", async () => {
		const response = await app.inject({ method: "GET", url: "/categories" });
		expect(response.statusCode).toBe(401);
	});
});
