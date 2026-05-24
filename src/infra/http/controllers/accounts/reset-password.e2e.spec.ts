import { randomUUID } from "node:crypto";
import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "@/app.ts";
import { prisma } from "@/infra/database/prisma.ts";

async function createUserAndRequestCode() {
	const email = faker.internet.email();
	const password = "pass123456";

	const signOnResponse = await app.inject({
		method: "POST",
		url: "/accounts/sign-on",
		body: { name: faker.person.fullName(), email, password },
	});

	const userId = signOnResponse.json().user.id as string;

	await app.inject({
		method: "POST",
		url: "/accounts/request/password",
		body: { email },
	});

	const token = await prisma.token.findFirst({ where: { userId } });

	return { email, password, code: token!.id };
}

describe("PATCH /accounts/reset/password (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("resets the password and returns 204", async () => {
		const { code } = await createUserAndRequestCode();

		const response = await app.inject({
			method: "PATCH",
			url: "/accounts/reset/password",
			body: { code, password: "newpass123", confirmPassword: "newpass123" },
		});

		expect(response.statusCode).toBe(204);
	});

	it("returns 400 when code does not exist", async () => {
		const response = await app.inject({
			method: "PATCH",
			url: "/accounts/reset/password",
			body: {
				code: randomUUID(),
				password: "newpass123",
				confirmPassword: "newpass123",
			},
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 400 when passwords do not match", async () => {
		const response = await app.inject({
			method: "PATCH",
			url: "/accounts/reset/password",
			body: {
				code: randomUUID(),
				password: "newpass123",
				confirmPassword: "different456",
			},
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 400 when code is not a valid UUID", async () => {
		const response = await app.inject({
			method: "PATCH",
			url: "/accounts/reset/password",
			body: {
				code: "not-a-uuid",
				password: "newpass123",
				confirmPassword: "newpass123",
			},
		});

		expect(response.statusCode).toBe(400);
	});
});
