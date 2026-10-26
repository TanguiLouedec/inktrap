import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/features.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: false,
  treeshake: true,
  target: "es2020",
});
