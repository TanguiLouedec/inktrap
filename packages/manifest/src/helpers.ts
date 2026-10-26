import type { FontManifest, FontSource } from "./types";

/** True for objects shaped like a {@link FontManifest} (a `family` string and a `faces` array). */
export const isFontManifest = (value: unknown): value is FontManifest =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as FontManifest).family === "string" &&
  Array.isArray((value as FontManifest).faces);

export interface FaceQuery {
  /** Defaults to 400. */
  weight?: number;
  /** Defaults to `"normal"`. */
  style?: string;
}

const keywords: Record<string, number> = { normal: 400, bold: 700 };

/** `[min, max]` of a `weight` descriptor: `400`, `"bold"` or a variable range like `"100 900"`. */
const weightRange = (weight: FontSource["weight"]): [number, number] => {
  const [lo = 400, hi = lo] = String(weight ?? "normal")
    .trim()
    .split(/\s+/)
    .map((w) => keywords[w] ?? Number(w));
  return [lo, hi];
};

/**
 * Picks the face of `manifest` that best matches `query`, like the browser would: faces with
 * the requested style first, then the one whose weight (or weight range) is closest.
 */
export const selectFace = (manifest: FontManifest, query: FaceQuery = {}): FontSource | undefined => {
  const style = query.style ?? "normal";
  const weight = query.weight ?? 400;
  const styled = manifest.faces.filter((face) => (face.style ?? "normal") === style);
  let best: FontSource | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const face of styled.length ? styled : manifest.faces) {
    const [lo, hi] = weightRange(face.weight);
    const distance = weight < lo ? lo - weight : weight > hi ? weight - hi : 0;
    if (distance < bestDistance) {
      best = face;
      bestDistance = distance;
    }
  }
  return best;
};

/** CSS `font-variation-settings` for axis coordinates: `{ wght: 600 }` → `"wght" 600`. */
export const variationSettings = (coordinates: Record<string, number>): string =>
  Object.entries(coordinates)
    .map(([tag, value]) => `"${tag}" ${value}`)
    .join(", ") || "normal";
