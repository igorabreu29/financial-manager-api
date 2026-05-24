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

describe("GET /categories/active (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("returns only active categories", async () => {
		const cookies = await authenticate();
		const name = `disabled-${randomUUID().slice(0, 8)}`;

		const createRes = await app.inject({
			method: "POST",
			url: "/categories",
			cookies,
			body: { name },
		});
		const categoryId = createRes.json().category.id as string;

		await app.inject({
			method: "PATCH",
			url: `/categories/${categoryId}/disable`,
			cookies,
		});

		const activeName = `active-${randomUUID().slice(0, 8)}`;
		await app.inject({
			method: "POST",
			url: "/categories",
			cookies,
			body: { name: activeName },
		});

		const response = await app.inject({
			method: "GET",
			url: "/categories/active",
			cookies,
		});

		expect(response.statusCode).toBe(200);
		const { categories } = response.json();
		expect(categories.every((c: { is_active: boolean }) => c.is_active)).toBe(
			true
		);
		expect(
			categories.some((c: { name: string }) => c.name === activeName)
		).toBe(true);
		expect(categories.some((c: { name: string }) => c.name === name)).toBe(
			false
		);
	});

	it("filters active categories by name", async () => {
		const cookies = await authenticate();
		const name = `active-${randomUUID().slice(0, 8)}`;

		await app.inject({
			method: "POST",
			url: "/categories",
			cookies,
			body: { name },
		});

		const response = await app.inject({
			method: "GET",
			url: `/categories/active?name=${encodeURIComponent(name)}`,
			cookies,
		});

		expect(response.statusCode).toBe(200);
		const { categories } = response.json();
		expect(categories.some((c: { name: string }) => c.name === name)).toBe(
			true
		);
	});

	it("returns 401 without authentication", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/categories/active",
		});
		expect(response.statusCode).toBe(401);
	});
});
