import { beforeEach, describe, expect, it } from "vitest";
import { makeUser } from "@/factories/make-user.ts";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory-categories-repository.ts";
import { InMemoryUsersRepository } from "@/repositories/in-memory-users-repository.ts";
import { OnUserRegistered } from "./on-user-registered.ts";

describe("On User Registered Subscriber", () => {
	let userRepository: InMemoryUsersRepository;
	let categoriesRepository: InMemoryCategoriesRepository;

	beforeEach(() => {
		userRepository = new InMemoryUsersRepository();
		categoriesRepository = new InMemoryCategoriesRepository();
	});

	it("should be able to dispatch an email when user is created", async () => {
		new OnUserRegistered(categoriesRepository);

		const user = makeUser();
		await userRepository.create(user);

		expect(categoriesRepository.categories).toHaveLength(5);
		expect(categoriesRepository.categories[0].props.userId).toEqual(user.id);
	});
});
