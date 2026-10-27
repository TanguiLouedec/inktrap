import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: false,
    target: "node20",
    external: ["@inktrapjs/core", "@inktrapjs/manifest"],
  },
  {
    // The bin is ESM only and imports the library entry, so `run` isn't bundled twice.
    entry: ["src/bin.ts"],
    format: ["esm"],
    sourcemap: false,
    target: "node20",
    external: ["@inktrapjs/core", "@inktrapjs/manifest", "./index.js"],
  },
]);
