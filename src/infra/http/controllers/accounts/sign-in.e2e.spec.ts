import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "@/app.ts";

describe("POST /accounts/sign-in (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("sets access_token and refresh_token HttpOnly cookies on valid credentials", async () => {
		const email = faker.internet.email();
		const password = "pass123456";

		await app.inject({
			method: "POST",
			url: "/accounts/sign-on",
			body: { name: faker.person.fullName(), email, password },
		});

		const response = await app.inject({
			method: "POST",
			url: "/accounts/sign-in",
			body: { email, password },
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toMatchObject({ user: { email } });

		const accessCookie = response.cookies.find(c => c.name === "access_token");
		const refreshCookie = response.cookies.find(c => c.name === "refresh_token");

		expect(accessCookie).toBeDefined();
		expect(accessCookie?.httpOnly).toBe(true);
		expect(accessCookie?.sameSite).toBe("Lax");
		expect(accessCookie?.path).toBe("/");

		expect(refreshCookie).toBeDefined();
		expect(refreshCookie?.httpOnly).toBe(true);
		expect(refreshCookie?.sameSite).toBe("Lax");
		expect(refreshCookie?.path).toBe("/accounts");
	});

	it("returns 401 on wrong password", async () => {
		const email = faker.internet.email();

		await app.inject({
			method: "POST",
			url: "/accounts/sign-on",
			body: { name: faker.person.fullName(), email, password: "correctpassword" },
		});

		const response = await app.inject({
			method: "POST",
			url: "/accounts/sign-in",
			body: { email, password: "wrongpassword" },
		});

		expect(response.statusCode).toBe(401);
	});

	it("returns 400 on malformed request body", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/accounts/sign-in",
			body: { email: "not-an-email", password: "x" },
		});

		expect(response.statusCode).toBe(400);
	});
});
