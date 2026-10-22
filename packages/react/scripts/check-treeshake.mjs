// Bundles each export on its own and fails if code from another export leaks in.
// Markers are string literals that survive minification.
import { build } from "esbuild";

const entry = new URL("../dist/index.js", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");

const markers = {
  Specimen: "quick brown fox",
  FontPreload: "preload",
  useFontFace: "swap",
};

const cases = [
  { imports: ["useFontFace"], forbidden: ["Specimen", "FontPreload"] },
  { imports: ["FontPreload", "preloadFont"], forbidden: ["Specimen", "useFontFace"] },
];

let failed = false;
for (const { imports, forbidden } of cases) {
  const result = await build({
    stdin: {
      contents: `import { ${imports.join(", ")} } from ${JSON.stringify(entry)}; console.log(${imports.join(", ")});`,
      resolveDir: process.cwd(),
    },
    bundle: true,
    minify: true,
    write: false,
    format: "esm",
    external: ["react", "react/jsx-runtime", "react-dom"],
  });
  const code = result.outputFiles[0].text;
  const leaked = forbidden.filter((name) => code.includes(markers[name]));
  const label = `import { ${imports.join(", ")} }`;
  if (leaked.length) {
    failed = true;
    console.error(`✗ ${label} pulls in: ${leaked.join(", ")}`);
  } else {
    console.log(`✓ ${label} is isolated (${code.length} B minified)`);
  }
}

if (failed) process.exit(1);
