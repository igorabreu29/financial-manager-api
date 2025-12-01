import type { User } from "../../enterprise/entities/user.ts";

export interface UsersRepository {
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	create(user: User): Promise<User>;
	save(user: User): Promise<void>;
}
