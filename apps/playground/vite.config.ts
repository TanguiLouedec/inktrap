import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Dev server reads the library source for instant HMR; `vite build` uses the built package.
  resolve:
    command === "serve"
      ? {
          alias: {
            "@inktrapjs/react": fileURLToPath(new URL("../../packages/react/src/index.ts", import.meta.url)),
            "@inktrapjs/manifest": fileURLToPath(
              new URL("../../packages/manifest/src/index.ts", import.meta.url),
            ),
          },
        }
      : {},
}));
