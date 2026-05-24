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

describe("POST /accounts/refresh (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("issues new access_token and rotated refresh_token cookies", async () => {
		const signInResponse = await registerAndSignIn();
		const originalRefreshCookie = signInResponse.cookies.find(
			c => c.name === "refresh_token"
		);
		expect(originalRefreshCookie).toBeDefined();

		const response = await app.inject({
			method: "POST",
			url: "/accounts/refresh",
			cookies: { refresh_token: originalRefreshCookie!.value },
		});

		expect(response.statusCode).toBe(200);

		const newAccessCookie = response.cookies.find(c => c.name === "access_token");
		const newRefreshCookie = response.cookies.find(
			c => c.name === "refresh_token"
		);

		expect(newAccessCookie).toBeDefined();
		expect(newRefreshCookie).toBeDefined();
		expect(newRefreshCookie!.value).not.toBe(originalRefreshCookie!.value);
	});

	it("old refresh token is invalidated after rotation", async () => {
		const signInResponse = await registerAndSignIn();
		const originalRefreshCookie = signInResponse.cookies.find(
			c => c.name === "refresh_token"
		);

		await app.inject({
			method: "POST",
			url: "/accounts/refresh",
			cookies: { refresh_token: originalRefreshCookie!.value },
		});

		const replayResponse = await app.inject({
			method: "POST",
			url: "/accounts/refresh",
			cookies: { refresh_token: originalRefreshCookie!.value },
		});

		expect(replayResponse.statusCode).toBe(401);
	});

	it("returns 401 on invalid token", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/accounts/refresh",
			cookies: { refresh_token: "not-a-valid-token" },
		});

		expect(response.statusCode).toBe(401);
	});

	it("returns 401 when refresh_token cookie is absent", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/accounts/refresh",
		});

		expect(response.statusCode).toBe(401);
	});
});
