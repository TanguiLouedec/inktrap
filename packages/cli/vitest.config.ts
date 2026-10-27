import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Tests run against the core and manifest sources, so they work before `pnpm build`.
    alias: {
      "@inktrapjs/core": fileURLToPath(new URL("../core/src/index.ts", import.meta.url)),
      "@inktrapjs/manifest": fileURLToPath(new URL("../manifest/src/index.ts", import.meta.url)),
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
  },
});
