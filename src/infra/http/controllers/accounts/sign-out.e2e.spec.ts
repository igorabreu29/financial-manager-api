import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "@/app.ts";

async function registerAndSignIn() {
	const email = faker.internet.email();
	const password = "pass123456";

	await app.inject({
		method: "POST",
		url: "/accounts/sign-on",
		body: { name: faker.person.fullName(), email, password },
	});

	return app.inject({
		method: "POST",
		url: "/accounts/sign-in",
		body: { email, password },
	});
}

describe("POST /accounts/sign-out (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("returns 200 and clears auth cookies", async () => {
		const signInResponse = await registerAndSignIn();
		const refreshCookie = signInResponse.cookies.find(
			c => c.name === "refresh_token"
		);
		expect(refreshCookie).toBeDefined();

		const response = await app.inject({
			method: "POST",
			url: "/accounts/sign-out",
			cookies: { refresh_token: refreshCookie!.value },
		});

		expect(response.statusCode).toBe(200);

		const clearedAccessCookie = response.cookies.find(c => c.name === "access_token");
		const clearedRefreshCookie = response.cookies.find(c => c.name === "refresh_token");

		expect(clearedAccessCookie).toBeDefined();
		expect(clearedRefreshCookie).toBeDefined();
		expect(clearedAccessCookie!.maxAge).toBe(0);
		expect(clearedRefreshCookie!.maxAge).toBe(0);
	});

	it("invalidates the refresh token in the database so it cannot be reused", async () => {
		const signInResponse = await registerAndSignIn();
		const refreshCookie = signInResponse.cookies.find(
			c => c.name === "refresh_token"
		);

		await app.inject({
			method: "POST",
			url: "/accounts/sign-out",
			cookies: { refresh_token: refreshCookie!.value },
		});

		const refreshResponse = await app.inject({
			method: "POST",
			url: "/accounts/refresh",
			cookies: { refresh_token: refreshCookie!.value },
		});

		expect(refreshResponse.statusCode).toBe(401);
	});

	it("returns 200 even when no refresh_token cookie is sent (idempotent)", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/accounts/sign-out",
		});

		expect(response.statusCode).toBe(200);
	});
});
