import type { Hasher } from "@/domain/accounts/app/cryptography/hasher.ts";

export class FakeHasher implements Hasher {
	async hash(plainText: string): Promise<string> {
		return plainText.concat("-hasher");
	}

	async compare(plainText: string, hash: string): Promise<boolean> {
		return plainText.concat("-hasher") === hash;
	}
}
