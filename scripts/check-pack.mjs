// Fails if the @inktrap/react tarball would ship anything besides dist/, package.json,
// README.md and LICENSE, or if its README/LICENSE drifted from the repo root copies.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const pkgDir = join(root, "packages", "react");

const out = execSync("npm pack --dry-run --json --ignore-scripts", { cwd: pkgDir, encoding: "utf8" });
const [{ files, size, unpackedSize }] = JSON.parse(out);

const allowed = (path) => path.startsWith("dist/") || ["package.json", "README.md", "LICENSE"].includes(path);

let failed = false;
for (const { path, size: bytes } of files) {
  const ok = allowed(path);
  if (!ok) failed = true;
  console.log(`${ok ? "✓" : "✗"} ${path} (${bytes} B)`);
}
console.log(`tarball: ${size} B packed, ${unpackedSize} B unpacked, ${files.length} files`);

if (!files.some((f) => f.path === "dist/index.js")) {
  console.error("✗ dist/index.js missing: run the build first");
  failed = true;
}

for (const name of ["README.md", "LICENSE"]) {
  if (readFileSync(join(root, name), "utf8") !== readFileSync(join(pkgDir, name), "utf8")) {
    console.error(`✗ packages/react/${name} differs from the root ${name}: copy it over`);
    failed = true;
  }
}

if (failed) {
  console.error("Pack check failed.");
  process.exit(1);
}
console.log("Pack check passed.");
