import type { FontFeature } from "./types";

/**
 * Readable labels for common OpenType feature tags, for building feature toggles.
 * Names follow the OpenType feature registry, shortened where it helps.
 */
export const featureLabels: Readonly<Record<string, string>> = {
  aalt: "Access all alternates",
  afrc: "Alternative fractions",
  c2pc: "Petite capitals from capitals",
  c2sc: "Small capitals from capitals",
  calt: "Contextual alternates",
  case: "Case-sensitive forms",
  ccmp: "Glyph composition",
  clig: "Contextual ligatures",
  cpsp: "Capital spacing",
  cswh: "Contextual swashes",
  dlig: "Discretionary ligatures",
  dnom: "Denominators",
  expt: "Expert forms",
  falt: "Final glyph on line alternates",
  fina: "Terminal forms",
  frac: "Fractions",
  fwid: "Full widths",
  half: "Half forms",
  hist: "Historical forms",
  hlig: "Historical ligatures",
  hwid: "Half widths",
  init: "Initial forms",
  isol: "Isolated forms",
  ital: "Italics",
  jalt: "Justification alternates",
  kern: "Kerning",
  liga: "Standard ligatures",
  lnum: "Lining figures",
  locl: "Localized forms",
  mark: "Mark positioning",
  medi: "Medial forms",
  mgrk: "Mathematical Greek",
  mkmk: "Mark to mark positioning",
  nalt: "Alternate annotation forms",
  numr: "Numerators",
  onum: "Oldstyle figures",
  opbd: "Optical bounds",
  ordn: "Ordinals",
  ornm: "Ornaments",
  pcap: "Petite capitals",
  pnum: "Proportional figures",
  pwid: "Proportional widths",
  rand: "Randomize",
  rlig: "Required ligatures",
  rvrn: "Required variation alternates",
  salt: "Stylistic alternates",
  sinf: "Scientific inferiors",
  size: "Optical size",
  smcp: "Small capitals",
  subs: "Subscript",
  sups: "Superscript",
  swsh: "Swash",
  titl: "Titling",
  tnum: "Tabular figures",
  unic: "Unicase",
  zero: "Slashed zero",
};

/**
 * Label for a feature: the font's own name if it has one (stylistic sets often do), then
 * {@link featureLabels}, then "Stylistic set N" / "Character variant N", then the tag itself.
 */
export const featureLabel = (feature: string | FontFeature): string => {
  const { tag, name } = typeof feature === "string" ? { tag: feature, name: undefined } : feature;
  if (name) return name;
  const known = featureLabels[tag];
  if (known) return known;
  const numbered = /^(ss|cv)(\d\d)$/.exec(tag);
  if (numbered)
    return `${numbered[1] === "ss" ? "Stylistic set" : "Character variant"} ${Number(numbered[2])}`;
  return tag;
};
