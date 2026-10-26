import { type CSSProperties, type HTMLAttributes, memo, useMemo } from "react";
import { type FaceSelection, type FontInput, sameFont, useFontInput } from "./resolveFont";
import { fontFamily, pangram, shallowEqual } from "./shared";

export interface SpecimenProps extends Omit<HTMLAttributes<HTMLDivElement>, "children">, FaceSelection {
  /** A font file, or a family manifest (pick its face with `face` or `instance`). */
  font: FontInput;
  /** Sample text. Defaults to a pangram. */
  text?: string;
  /** Font size; numbers are pixels. */
  size?: number | string;
  /**
   * Fallback `font-family` shown while the font loads. Pair it with a metric-adjusted
   * `@font-face` (`size-adjust`, `ascent-override`, ...) to avoid layout shift.
   */
  fallback?: string;
}

function SpecimenImpl({ font, face, instance, text, size, fallback, style, ...rest }: SpecimenProps) {
  const { status, family, faceCss } = useFontInput(font, face, instance);
  // The font is applied up front; the browser shows `fallback` until the face is ready.
  // Status changes don't touch the style object.
  const css = useMemo<CSSProperties>(
    () => ({
      ...faceCss,
      ...style,
      fontFamily: fontFamily(family, fallback),
      ...(size === undefined ? null : { fontSize: size }),
    }),
    [faceCss, style, family, fallback, size],
  );
  return (
    <div {...rest} style={css} data-inktrap-status={status}>
      {text ?? pangram}
    </div>
  );
}

// Inline `font`, `face` and `style` objects are compared by value, so parents can re-render freely.
const propsEqual = (prev: SpecimenProps, next: SpecimenProps): boolean => {
  const { font: pf, face: pa, style: ps, ...pr } = prev;
  const { font: nf, face: na, style: ns, ...nr } = next;
  return sameFont(pf, nf) && shallowEqual(pa, na) && shallowEqual(ps, ns) && shallowEqual(pr, nr);
};

/** Renders sample text in a self-hosted font. Unstyled apart from the font itself. */
export const Specimen = /* @__PURE__ */ memo(SpecimenImpl, propsEqual);
