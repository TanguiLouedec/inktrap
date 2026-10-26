// Fails if a published package's tarball would ship anything besides dist/, package.json,
// README.md and LICENSE, or if its LICENSE drifted from the repo root copy. @inktrapjs/react
// ships the root README, so that one must match too; other packages have their own.
import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const packagesDir = join(root, "packages");

const allowed = (path) => path.startsWith("dist/") || ["package.json", "README.md", "LICENSE"].includes(path);

let failed = false;
for (const dir of readdirSync(packagesDir)) {
  const pkgDir = join(packagesDir, dir);
  const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
  if (pkg.private) continue;
  console.log(`\n${pkg.name}`);

  const out = execSync("npm pack --dry-run --json --ignore-scripts", { cwd: pkgDir, encoding: "utf8" });
  const [{ files, size, unpackedSize }] = JSON.parse(out);

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
    if (!files.some((f) => f.path === name)) {
      console.error(`✗ ${name} missing`);
      failed = true;
    }
  }

  const mustMatch = dir === "react" ? ["README.md", "LICENSE"] : ["LICENSE"];
  for (const name of mustMatch) {
    if (readFileSync(join(root, name), "utf8") !== readFileSync(join(pkgDir, name), "utf8")) {
      console.error(`✗ packages/${dir}/${name} differs from the root ${name}: copy it over`);
      failed = true;
    }
  }
}

if (failed) {
  console.error("Pack check failed.");
  process.exit(1);
}
console.log("\nPack check passed.");
