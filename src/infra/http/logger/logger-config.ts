import { env } from "@/infra/env/index.ts";

export const loggerConfig = () => {
	if (env.NODE_ENV === "production") return true;

	return env.NODE_ENV === "test"
		? false
		: {
				transport: {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "HH:MM:ss",
						ignore: "pid,hostname",
					},
				},
			};
};
