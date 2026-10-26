const quote = (family: string): string => `"${family.replace(/["\\]/g, "\\$&")}"`;

/** `font-family` value: the quoted family, then the optional fallback list. */
export const fontFamily = (family: string, fallback: string | undefined): string =>
  fallback ? `${quote(family)}, ${fallback}` : quote(family);

export const shallowEqual = (a: object | undefined, b: object | undefined): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((k) => Object.is(a[k as keyof typeof a], b[k as keyof typeof b]));
};

/** Default sample text. */
export const pangram = "The quick brown fox jumps over the lazy dog";
