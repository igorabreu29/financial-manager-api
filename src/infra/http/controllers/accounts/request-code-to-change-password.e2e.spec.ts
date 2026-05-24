import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "@/app.ts";

describe("POST /accounts/request/password (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("returns 204 when user exists", async () => {
		const email = faker.internet.email();

		await app.inject({
			method: "POST",
			url: "/accounts/sign-on",
			body: { name: faker.person.fullName(), email, password: "pass123456" },
		});

		const response = await app.inject({
			method: "POST",
			url: "/accounts/request/password",
			body: { email },
		});

		expect(response.statusCode).toBe(204);
	});

	it("returns 401 when email is not registered", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/accounts/request/password",
			body: { email: faker.internet.email() },
		});

		expect(response.statusCode).toBe(401);
	});

	it("returns 400 when email is invalid", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/accounts/request/password",
			body: { email: "not-an-email" },
		});

		expect(response.statusCode).toBe(400);
	});
});
