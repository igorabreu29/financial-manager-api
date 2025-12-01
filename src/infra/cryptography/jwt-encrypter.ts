import { app } from "@/app.ts";
import type { Encrypter } from "@/domain/accounts/app/cryptography/encrypter.ts";

export class JWTEncrypter implements Encrypter {
	encrypt(payload: Record<string, unknown>): string {
		const token = app.jwt.sign(payload, { expiresIn: "1d" });
		return token;
	}
}
