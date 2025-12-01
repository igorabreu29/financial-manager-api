import bcryptjs from "bcryptjs";
import type { Hasher } from "@/domain/accounts/app/cryptography/hasher.ts";
import { env } from "../env/index.ts";

export class BcryptHasher implements Hasher {
	async hash(plainText: string): Promise<string> {
		return await bcryptjs.hash(plainText, env.BCRYPT_ROUND);
	}

	async compare(plainText: string, hash: string): Promise<boolean> {
		return await bcryptjs.compare(plainText, hash);
	}
}
