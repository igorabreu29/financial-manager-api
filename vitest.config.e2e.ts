import swc from "unplugin-swc";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    swc.vite({
      module: { type: "es6" },
    }),
  ],
  test: {
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.e2e-spec.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    pool: "threads",
    coverage: {
      enabled: false,
    },
  },
});
