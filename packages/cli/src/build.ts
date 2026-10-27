import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";
import { readFontManifests } from "@inktrapjs/core";
import type { FontManifest } from "@inktrapjs/manifest";

export interface BuildOptions {
  /** Folder to read font files from, searched recursively. */
  dir: string;
  /** Folder the manifests are written to. Created if missing. */
  out: string;
  /**
   * Prefix for each face's `src`. Without it, `src` is the font's path relative to `dir`, which
   * the browser resolves against the page URL.
   */
  baseUrl?: string;
}

export interface BuiltManifest {
  /** Path of the written JSON file. */
  file: string;
  manifest: FontManifest;
}

const fontExtensions = new Set([".ttf", ".otf", ".woff", ".woff2"]);

/** File name for a family's manifest: `"Space Grotesk"` → `space-grotesk.json`. */
export const manifestFileName = (family: string): string =>
  `${
    family
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "font"
  }.json`;

const findFonts = async (dir: string): Promise<string[]> => {
  const isDirectory = await stat(dir).then(
    (stats) => stats.isDirectory(),
    () => false,
  );
  if (!isDirectory) throw new Error(`${dir} is not a folder`);
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && fontExtensions.has(extname(entry.name).toLowerCase()))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
};

const toUrl = (dir: string, baseUrl: string | undefined) => (path: string) => {
  const url = relative(dir, path).split(sep).map(encodeURIComponent).join("/");
  if (baseUrl === undefined) return url;
  return baseUrl.endsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};

/** Reads every font file under `dir` and writes one manifest per family to `out`. */
export const buildManifests = async ({ dir, out, baseUrl }: BuildOptions): Promise<BuiltManifest[]> => {
  const paths = await findFonts(dir);
  if (!paths.length) throw new Error(`No font files (.ttf, .otf, .woff, .woff2) found in ${dir}`);

  const manifests = await readFontManifests(paths, { src: toUrl(dir, baseUrl) });

  const byFile = new Map<string, FontManifest>();
  for (const manifest of manifests) {
    const name = manifestFileName(manifest.family);
    const clash = byFile.get(name);
    if (clash)
      throw new Error(`Families "${clash.family}" and "${manifest.family}" would both write ${name}`);
    byFile.set(name, manifest);
  }

  await mkdir(out, { recursive: true });
  return Promise.all(
    [...byFile].map(async ([name, manifest]) => {
      const file = join(out, name);
      await writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`);
      return { file, manifest };
    }),
  );
};
