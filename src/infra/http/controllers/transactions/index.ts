import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { activeCategory } from "./active-category.ts";
import { createCategory } from "./create-category.ts";
import { createTransaction } from "./create-transaction.ts";
import { deleteCategory } from "./delete-category.ts";
import { deleteTransaction } from "./delete-transaction.ts";
import { disableCategory } from "./disable-category.ts";
import { getActiveCategories } from "./get-active-categories.ts";
import { getCategories } from "./get-categories.ts";
import { getTransactions } from "./get-transactions.ts";
import { updateCategory } from "./update-category.ts";

export const transactions: FastifyPluginCallbackZod = app => {
	app.register(getActiveCategories);
	app.register(getCategories);
	app.register(createCategory);
	app.register(updateCategory);
	app.register(activeCategory);
	app.register(disableCategory);
	app.register(deleteCategory);
	app.register(getTransactions);
	app.register(createTransaction);
	app.register(deleteTransaction);
};
