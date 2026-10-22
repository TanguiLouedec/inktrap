/** A self-hosted font file plus the FontFace descriptors that select it. */
export interface FontSource {
  /** The `font-family` name the face is registered under. */
  family: string;
  /** URL of the font file (woff2 recommended), a CSS `src` value, or a list of fallbacks. */
  src: string | readonly string[];
  weight?: string | number;
  style?: string;
  stretch?: string;
  unicodeRange?: string;
  /** Defaults to `"swap"`. */
  display?: FontDisplay;
}

export type FontStatus = "loading" | "loaded" | "error";
