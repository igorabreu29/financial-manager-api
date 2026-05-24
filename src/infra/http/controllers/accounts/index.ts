import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { authenticateWithCredentials } from "./authenticate-with-credentials.ts";
import { refreshToken } from "./refresh-token.ts";
import { registerUser } from "./register-user.ts";
import { requestCode } from "./request-code-to-change-password.ts";
import { resetPassword } from "./reset-password.ts";
import { signOut } from "./sign-out.ts";

export const accounts: FastifyPluginCallbackZod = app => {
	app.register(registerUser);
	app.register(authenticateWithCredentials);
	app.register(requestCode);
	app.register(resetPassword);
	app.register(refreshToken);
	app.register(signOut);
};
