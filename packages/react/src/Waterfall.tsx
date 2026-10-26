import { type CSSProperties, type HTMLAttributes, memo, useMemo } from "react";
import { fontKey } from "./fontCache";
import { fontFamily, pangram, shallowEqual } from "./shared";
import type { FontSource } from "./types";
import { useFontFace } from "./useFontFace";

export interface WaterfallProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  font: FontSource;
  /** Sample text, repeated at every size. Defaults to a pangram. */
  text?: string;
  /** Font sizes from first to last row; numbers are pixels. Defaults to {@link defaultWaterfallSizes}. */
  sizes?: readonly (number | string)[];
  /** Fallback `font-family` shown while the font loads (see `<Specimen />`). */
  fallback?: string;
}

/** Sizes `<Waterfall />` uses when `sizes` isn't set, in pixels. */
export const defaultWaterfallSizes: readonly number[] = [12, 14, 16, 20, 24, 32, 40, 48, 64, 80, 96];

function WaterfallImpl({
  font,
  text,
  sizes = defaultWaterfallSizes,
  fallback,
  style,
  ...rest
}: WaterfallProps) {
  const { status, family } = useFontFace(font);
  const css = useMemo<CSSProperties>(
    () => ({ ...style, fontFamily: fontFamily(family, fallback) }),
    [style, family, fallback],
  );
  return (
    <div {...rest} style={css} data-inktrap-status={status} data-inktrap-waterfall="">
      {sizes.map((size, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: rows are stateless and sizes can repeat
        <div key={`${i}:${size}`} style={{ fontSize: size }} data-inktrap-size={size}>
          {text ?? pangram}
        </div>
      ))}
    </div>
  );
}

const sameSizes = (a: WaterfallProps["sizes"], b: WaterfallProps["sizes"]): boolean =>
  a === b || (!!a && !!b && a.length === b.length && a.every((size, i) => size === b[i]));

// Inline `font`, `style` and `sizes` are compared by value, so parents can re-render freely.
const propsEqual = (prev: WaterfallProps, next: WaterfallProps): boolean => {
  const { font: pf, style: ps, sizes: pz, ...pr } = prev;
  const { font: nf, style: ns, sizes: nz, ...nr } = next;
  return fontKey(pf) === fontKey(nf) && sameSizes(pz, nz) && shallowEqual(ps, ns) && shallowEqual(pr, nr);
};

/** Renders the same text at a range of sizes in a self-hosted font. Unstyled apart from the font. */
export const Waterfall = /* @__PURE__ */ memo(WaterfallImpl, propsEqual);
