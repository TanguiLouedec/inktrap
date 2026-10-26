import {
  type FaceQuery,
  type FontManifest,
  isFontManifest,
  selectFace,
  variationSettings,
} from "@inktrapjs/manifest";
import { type CSSProperties, useMemo } from "react";
import { fontKey } from "./fontCache";
import type { FontSource } from "./types";
import { type FontFaceState, useFontFace } from "./useFontFace";

/** A single font file, or a whole family described by a manifest. */
export type FontInput = FontSource | FontManifest;

export interface FaceSelection {
  /** With a manifest: picks the face like the browser would (style first, then closest weight). */
  face?: FaceQuery;
  /** With a manifest: a named instance (`"Bold Italic"`), applied with `font-variation-settings`. */
  instance?: string;
}

/**
 * The face to load for `font`, plus the CSS that selects it. A `FontSource` is used as is,
 * with no extra CSS, so its output is unchanged.
 */
export const resolveFont = (
  font: FontInput,
  { face, instance }: FaceSelection,
): [source: FontSource, css: CSSProperties | null] => {
  if (!isFontManifest(font)) return [font, null];
  const named = instance === undefined ? undefined : font.instances?.find((i) => i.name === instance);
  const weight = face?.weight ?? named?.coordinates.wght;
  const style = face?.style ?? named?.style;
  // A manifest without faces yields an empty source, which reports "error".
  const source = selectFace(font, { weight, style }) ?? { family: font.family, src: [] };
  return [
    source,
    {
      ...(weight === undefined ? null : { fontWeight: weight }),
      ...(style === undefined ? null : { fontStyle: style }),
      ...(named ? { fontVariationSettings: variationSettings(named.coordinates) } : null),
    },
  ];
};

/** Inline sources are compared by value; manifests (usually module constants) by identity. */
export const sameFont = (a: FontInput, b: FontInput): boolean =>
  a === b || (!isFontManifest(a) && !isFontManifest(b) && fontKey(a) === fontKey(b));

/** {@link useFontFace} for a source or a manifest face, plus the CSS that selects the face. */
export const useFontInput = (
  font: FontInput,
  face: FaceQuery | undefined,
  instance: string | undefined,
): FontFaceState & { faceCss: CSSProperties | null } => {
  // Keyed on the face's values, so inline `face` objects don't recompute.
  const weight = face?.weight;
  const style = face?.style;
  const [source, faceCss] = useMemo(
    () => resolveFont(font, { face: { weight, style }, instance }),
    [font, weight, style, instance],
  );
  return { ...useFontFace(source), faceCss };
};
