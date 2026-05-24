import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "@/app.ts";

describe("POST /accounts/sign-on (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("creates a user and returns 201 with user data", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/accounts/sign-on",
			body: {
				name: faker.person.fullName(),
				email: faker.internet.email(),
				password: "pass123456",
			},
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toMatchObject({
			user: {
				id: expect.any(String),
				name: expect.any(String),
				email: expect.any(String),
				created_at: expect.any(String),
			},
		});
	});

	it("returns 409 when email is already registered", async () => {
		const email = faker.internet.email();

		await app.inject({
			method: "POST",
			url: "/accounts/sign-on",
			body: { name: faker.person.fullName(), email, password: "pass123456" },
		});

		const response = await app.inject({
			method: "POST",
			url: "/accounts/sign-on",
			body: { name: faker.person.fullName(), email, password: "pass123456" },
		});

		expect(response.statusCode).toBe(409);
	});

	it("returns 400 when name is shorter than 3 characters", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/accounts/sign-on",
			body: { name: "AB", email: faker.internet.email(), password: "pass123456" },
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 400 when email is invalid", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/accounts/sign-on",
			body: { name: faker.person.fullName(), email: "not-an-email", password: "pass123456" },
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 400 when password is shorter than 6 characters", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/accounts/sign-on",
			body: { name: faker.person.fullName(), email: faker.internet.email(), password: "abc" },
		});

		expect(response.statusCode).toBe(400);
	});
});
