import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "@/app.ts";

describe("GET /health (E2E)", () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("returns 200 with ok: true", async () => {
		const response = await app.inject({ method: "GET", url: "/health" });

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ ok: true });
	});
});
