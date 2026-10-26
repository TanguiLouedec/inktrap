import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Tests run against the manifest source, so they work before `pnpm build`.
    alias: { "@inktrapjs/manifest": fileURLToPath(new URL("../manifest/src/index.ts", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    benchmark: {
      include: ["src/**/*.bench.{ts,tsx}"],
    },
  },
});
