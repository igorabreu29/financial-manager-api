export abstract class Hasher {
	abstract hash(plainText: string): Promise<string>;
	abstract compare(plainText: string, hash: string): Promise<boolean>;
}
