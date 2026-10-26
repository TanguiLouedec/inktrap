import { readFile } from "node:fs/promises";
import type { FontAxis, FontFeature, FontInstance, FontMetrics, FontSource } from "@inktrapjs/manifest";
import * as fontkit from "fontkit";

/** Thrown when a file can't be read or isn't a supported font. */
export class FontReadError extends Error {
  override name = "FontReadError";
  constructor(
    message: string,
    /** The file that failed. */
    readonly path: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

/** Everything read from one font file, before files are grouped into families. */
export interface FontFileInfo {
  path: string;
  /** Typographic family name (name ID 16, falling back to ID 1). */
  family: string;
  /** Outer container: `"TTF"` (also used for OTF), `"WOFF"` or `"WOFF2"`. */
  format: "TTF" | "WOFF" | "WOFF2";
  /** `FontFace` descriptors for this file, without `src`. */
  descriptors: Omit<FontSource, "family" | "src">;
  version?: string;
  designers?: string[];
  designerUrl?: string;
  copyright?: string;
  license?: { name?: string; url?: string };
  metrics: FontMetrics;
  axes: FontAxis[];
  instances: FontInstance[];
  features: FontFeature[];
}

type Localized = Record<string, string> | undefined;

// fontkit's Font type doesn't cover every table it parses; these are the parts we read.
interface FontkitFont {
  type: string;
  unitsPerEm: number;
  ascent: number;
  descent: number;
  lineGap: number;
  xHeight: number;
  capHeight: number;
  availableFeatures: string[];
  getName(key: string, lang?: string): string | null;
  name: { records: Record<string, Localized> & { fontFeatures?: Record<number, Localized> } };
  "OS/2": {
    usWeightClass: number;
    usWidthClass: number;
    fsSelection: { italic: boolean; oblique: boolean; useTypoMetrics: boolean };
    typoAscender: number;
    typoDescender: number;
    typoLineGap: number;
  };
  fvar?: {
    axis: {
      axisTag: string;
      minValue: number;
      defaultValue: number;
      maxValue: number;
      flags: number;
      name: Localized;
    }[];
    instance: { name: Localized; coord: number[]; postscriptNameID?: number }[];
  };
  GSUB?: { featureList: { tag: string; feature: { featureParams?: { nameID: number } } }[] };
  GPOS?: { featureList: { tag: string; feature: { featureParams?: { nameID: number } } }[] };
}

const localized = (value: Localized): string | undefined =>
  value ? (value.en ?? Object.values(value)[0]) || undefined : undefined;

const widths = [50, 62.5, 75, 87.5, 100, 112.5, 125, 150, 200];

const range = (min: number, max: number, unit = ""): string =>
  min === max ? `${min}${unit}` : `${min}${unit} ${max}${unit}`;

/** "A, B and C" → ["A", "B", "C"]. */
const splitNames = (value: string): string[] =>
  value
    .split(/\s*[,;/]\s*|\s+(?:and|&)\s+/)
    .map((name) => name.trim())
    .filter(Boolean);

const AXIS_HIDDEN = 0x0001;
const NO_NAME = 0xffff;

export const fontInfo = (path: string, font: FontkitFont): FontFileInfo => {
  const name = (key: string) => font.getName(key) ?? undefined;
  const highName = (id: number | undefined) =>
    id === undefined || id === NO_NAME ? undefined : localized(font.name.records.fontFeatures?.[id]);
  const family = name("preferredFamily") ?? name("fontFamily");
  if (!family) throw new FontReadError("Font has no family name", path);

  const os2 = font["OS/2"];
  const fvarAxes = font.fvar?.axis ?? [];
  const axes: FontAxis[] = fvarAxes.map((axis) => ({
    tag: axis.axisTag,
    ...(localized(axis.name) ? { name: localized(axis.name) } : null),
    min: axis.minValue,
    default: axis.defaultValue,
    max: axis.maxValue,
    ...(axis.flags & AXIS_HIDDEN ? { hidden: true } : null),
  }));
  const axis = (tag: string) => axes.find((a) => a.tag === tag);

  const wght = axis("wght");
  const wdth = axis("wdth");
  const style = os2.fsSelection.italic ? "italic" : os2.fsSelection.oblique ? "oblique" : undefined;
  const stretch = wdth ? range(wdth.min, wdth.max, "%") : `${widths[os2.usWidthClass - 1] ?? 100}%`;
  const descriptors: FontFileInfo["descriptors"] = {
    weight: wght ? range(wght.min, wght.max) : os2.usWeightClass,
    ...(style ? { style } : null),
    ...(stretch === "100%" ? null : { stretch }),
  };

  const instances: FontInstance[] = (font.fvar?.instance ?? []).flatMap((instance) => {
    const instanceName = localized(instance.name);
    if (!instanceName) return [];
    const postScriptName = highName(instance.postscriptNameID);
    return [
      {
        name: instanceName,
        coordinates: Object.fromEntries(
          fvarAxes.map((a, i) => [a.axisTag, instance.coord[i] ?? a.defaultValue]),
        ),
        ...(postScriptName ? { postScriptName } : null),
        ...(style ? { style } : null),
      },
    ];
  });

  // Stylistic sets (ssXX) and character variants (cvXX) can name themselves; their
  // FeatureParams both start with a name ID. Other features' params mean something else.
  const featureNames = new Map<string, string>();
  for (const record of [...(font.GSUB?.featureList ?? []), ...(font.GPOS?.featureList ?? [])]) {
    const featureName = /^(ss|cv)\d\d$/.test(record.tag)
      ? highName(record.feature.featureParams?.nameID)
      : undefined;
    if (featureName && !featureNames.has(record.tag)) featureNames.set(record.tag, featureName);
  }
  const features = [...new Set(font.availableFeatures)].map((tag) => {
    const featureName = featureNames.get(tag);
    return featureName ? { tag, name: featureName } : { tag };
  });

  const typo = os2.fsSelection.useTypoMetrics;
  const metrics: FontMetrics = {
    unitsPerEm: font.unitsPerEm,
    ascender: typo ? os2.typoAscender : font.ascent,
    descender: typo ? os2.typoDescender : font.descent,
    lineGap: typo ? os2.typoLineGap : font.lineGap,
    ...(font.xHeight ? { xHeight: font.xHeight } : null),
    ...(font.capHeight ? { capHeight: font.capHeight } : null),
  };

  const designer = name("designer");
  const licenseName = name("license");
  const licenseUrl = name("licenseURL");
  return {
    path,
    family,
    format: font.type === "WOFF2" ? "WOFF2" : font.type === "WOFF" ? "WOFF" : "TTF",
    descriptors,
    ...(name("version") ? { version: name("version") } : null),
    ...(designer ? { designers: splitNames(designer) } : null),
    ...(name("designerURL") ? { designerUrl: name("designerURL") } : null),
    ...(name("copyright") ? { copyright: name("copyright") } : null),
    ...(licenseName || licenseUrl
      ? {
          license: {
            ...(licenseName ? { name: licenseName } : null),
            ...(licenseUrl ? { url: licenseUrl } : null),
          },
        }
      : null),
    metrics,
    axes,
    instances,
    features,
  };
};

/** Reads one TTF, OTF, WOFF or WOFF2 file. */
export const readFontFile = async (path: string): Promise<FontFileInfo> => {
  let buffer: Buffer;
  try {
    buffer = await readFile(path);
  } catch (cause) {
    throw new FontReadError(`Can't read ${path}: ${(cause as Error).message}`, path, { cause });
  }
  let font: FontkitFont;
  try {
    font = fontkit.create(buffer) as unknown as FontkitFont;
  } catch (cause) {
    throw new FontReadError(`${path} is not a TTF, OTF, WOFF or WOFF2 font`, path, { cause });
  }
  if (!["TTF", "WOFF", "WOFF2"].includes(font.type)) {
    throw new FontReadError(`${path}: font collections (${font.type}) are not supported`, path);
  }
  return fontInfo(path, font);
};
