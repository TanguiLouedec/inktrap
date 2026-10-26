import { type FontAxis, type FontManifest, type FontSource, selectFace } from "@inktrapjs/manifest";
import { type FontFileInfo, readFontFile } from "./readFont";

export interface ReadOptions {
  /**
   * Turns a font file path into the URL written to the face's `src`. Defaults to the path
   * as given. The CLI and the Vite plugin use this to point at the published files.
   */
  src?: (path: string) => string;
}

// Smallest format first when one face exists in several formats.
const formatOrder: Record<FontFileInfo["format"], number> = { WOFF2: 0, WOFF: 1, TTF: 2 };

const faceKey = (file: FontFileInfo): string =>
  JSON.stringify([file.descriptors.weight, file.descriptors.style, file.descriptors.stretch]);

const weightMin = (weight: FontSource["weight"]): number => Number.parseFloat(String(weight ?? 400));

/** Builds one manifest from files of the same family. */
export const familyManifest = (files: readonly FontFileInfo[], options: ReadOptions = {}): FontManifest => {
  const toSrc = options.src ?? ((path: string) => path);
  const [first] = files;
  if (!first) throw new Error("familyManifest needs at least one file");
  const { family } = first;

  // Files with identical descriptors are the same face in different formats.
  const byFace = new Map<string, FontFileInfo[]>();
  for (const file of files) {
    const key = faceKey(file);
    byFace.set(key, [...(byFace.get(key) ?? []), file]);
  }
  const faceFiles = [...byFace.values()]
    .map((group) => group.sort((a, b) => formatOrder[a.format] - formatOrder[b.format]))
    .sort(
      ([a], [b]) =>
        Number(!!a?.descriptors.style) - Number(!!b?.descriptors.style) ||
        weightMin(a?.descriptors.weight) - weightMin(b?.descriptors.weight),
    );
  const faces: FontSource[] = faceFiles.map((group) => {
    const srcs = group.map((file) => toSrc(file.path));
    return { family, src: srcs.length === 1 ? (srcs[0] as string) : srcs, ...group[0]?.descriptors };
  });

  // Family-wide values come from the face a browser would use for regular text.
  const regularFace = selectFace({ family, faces });
  const regular = faceFiles[faces.indexOf(regularFace as FontSource)]?.[0] ?? first;

  const axes = new Map<string, FontAxis>();
  for (const file of [regular, ...files]) {
    for (const axis of file.axes) {
      const known = axes.get(axis.tag);
      axes.set(
        axis.tag,
        known ? { ...known, min: Math.min(known.min, axis.min), max: Math.max(known.max, axis.max) } : axis,
      );
    }
  }

  const instances = new Map<string, NonNullable<FontManifest["instances"]>[number]>();
  const features = new Map<string, NonNullable<FontManifest["features"]>[number]>();
  for (const [file] of faceFiles) {
    for (const instance of file?.instances ?? []) {
      if (!instances.has(instance.name)) instances.set(instance.name, instance);
    }
    for (const feature of file?.features ?? []) {
      if (!features.get(feature.tag)?.name) features.set(feature.tag, feature);
    }
  }

  return {
    schemaVersion: 1,
    family,
    faces,
    ...(regular.version ? { version: regular.version } : null),
    ...(regular.designers ? { designers: regular.designers } : null),
    ...(regular.designerUrl ? { designerUrl: regular.designerUrl } : null),
    ...(regular.copyright ? { copyright: regular.copyright } : null),
    ...(regular.license ? { license: regular.license } : null),
    metrics: regular.metrics,
    ...(axes.size ? { axes: [...axes.values()] } : null),
    ...(instances.size ? { instances: [...instances.values()] } : null),
    ...(features.size ? { features: [...features.values()] } : null),
  };
};

/**
 * Reads font files and returns one manifest per family, in the order families first appear.
 * Files of the same family (e.g. roman and italic, or one face as woff2 and ttf) are grouped.
 */
export const readFontManifests = async (
  paths: string | readonly string[],
  options: ReadOptions = {},
): Promise<FontManifest[]> => {
  const files = await Promise.all((typeof paths === "string" ? [paths] : paths).map(readFontFile));
  const families = new Map<string, FontFileInfo[]>();
  for (const file of files) families.set(file.family, [...(families.get(file.family) ?? []), file]);
  return [...families.values()].map((group) => familyManifest(group, options));
};

/** Like {@link readFontManifests}, for files of a single family. Throws if they span several. */
export const readFontManifest = async (
  paths: string | readonly string[],
  options: ReadOptions = {},
): Promise<FontManifest> => {
  const manifests = await readFontManifests(paths, options);
  if (manifests.length !== 1) {
    throw new Error(
      manifests.length
        ? `Expected one font family, found ${manifests.length}: ${manifests.map((m) => m.family).join(", ")}`
        : "No font files given",
    );
  }
  return manifests[0] as FontManifest;
};
