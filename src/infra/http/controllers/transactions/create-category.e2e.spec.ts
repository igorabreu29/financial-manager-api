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

	return { access_token: res.cookies.find(c => c.name === "access_token")!.value };
}

describe("POST /categories (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("creates a category and returns 201", async () => {
		const cookies = await authenticate();
		const name = faker.commerce.department();

		const response = await app.inject({
			method: "POST",
			url: "/categories",
			cookies,
			body: { name },
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toMatchObject({
			category: {
				id: expect.any(String),
				name,
				is_active: true,
				is_global: false,
			},
		});
	});

	it("returns 409 when category name already exists for the user", async () => {
		const cookies = await authenticate();
		const name = faker.commerce.department();

		await app.inject({
			method: "POST",
			url: "/categories",
			cookies,
			body: { name },
		});

		const response = await app.inject({
			method: "POST",
			url: "/categories",
			cookies,
			body: { name },
		});

		expect(response.statusCode).toBe(409);
	});

	it("returns 400 when name is shorter than 3 characters", async () => {
		const cookies = await authenticate();

		const response = await app.inject({
			method: "POST",
			url: "/categories",
			cookies,
			body: { name: "AB" },
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 401 without authentication", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/categories",
			body: { name: faker.commerce.department() },
		});

		expect(response.statusCode).toBe(401);
	});
});
