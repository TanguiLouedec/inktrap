import { type CSSProperties, type HTMLAttributes, memo, useMemo } from "react";
import { fontKey } from "./fontCache";
import { fontFamily, pangram, shallowEqual } from "./shared";
import type { FontSource } from "./types";
import { useFontFace } from "./useFontFace";

export interface SpecimenProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  font: FontSource;
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

function SpecimenImpl({ font, text, size, fallback, style, ...rest }: SpecimenProps) {
  const { status, family } = useFontFace(font);
  // The font is applied up front; the browser shows `fallback` until the face is ready.
  // Status changes don't touch the style object.
  const css = useMemo<CSSProperties>(
    () => ({
      ...style,
      fontFamily: fontFamily(family, fallback),
      ...(size === undefined ? null : { fontSize: size }),
    }),
    [style, family, fallback, size],
  );
  return (
    <div {...rest} style={css} data-inktrap-status={status}>
      {text ?? pangram}
    </div>
  );
}

// Inline `font` and `style` objects are compared by value, so parents can re-render freely.
const propsEqual = (prev: SpecimenProps, next: SpecimenProps): boolean => {
  const { font: pf, style: ps, ...pr } = prev;
  const { font: nf, style: ns, ...nr } = next;
  return fontKey(pf) === fontKey(nf) && shallowEqual(ps, ns) && shallowEqual(pr, nr);
};

/** Renders sample text in a self-hosted font. Unstyled apart from the font itself. */
export const Specimen = /* @__PURE__ */ memo(SpecimenImpl, propsEqual);
