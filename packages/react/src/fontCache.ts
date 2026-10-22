import type { FontSource, FontStatus } from "./types";

interface Entry {
  status: FontStatus;
  refs: number;
  face: FontFace | undefined;
  /** False when we adopted a face someone else added to `document.fonts`. */
  owned: boolean;
  listeners: Set<() => void>;
}

// Created lazily so that importing this module runs no code.
let cache: Map<string, Entry> | undefined;
let requests = 0;

const canLoad = (): boolean =>
  typeof document !== "undefined" && typeof FontFace !== "undefined" && !!document.fonts;

/** Stable cache key: identical sources + descriptors share one FontFace. */
export const fontKey = (font: FontSource): string =>
  JSON.stringify([
    font.family,
    font.src,
    font.weight,
    font.style,
    font.stretch,
    font.unicodeRange,
    font.display ?? "swap",
  ]);

const toCssSrc = (src: FontSource["src"]): string =>
  (Array.isArray(src) ? src : [src])
    .map((s) => (/^(url|local)\(/.test(s) ? s : `url(${JSON.stringify(s)})`))
    .join(", ");

const unquote = (family: string): string => family.replace(/^["']|["']$/g, "");

const weightAliases: Record<string, string> = { normal: "400", bold: "700" };
const normWeight = (weight: string): string => weightAliases[weight] ?? weight;

/** Finds a matching face already in `document.fonts` (e.g. from a previous page or a stylesheet). */
const findExisting = (font: FontSource): FontFace | undefined => {
  for (const face of document.fonts) {
    if (
      unquote(face.family) === font.family &&
      normWeight(face.weight) === normWeight(String(font.weight ?? "normal")) &&
      face.style === (font.style ?? "normal") &&
      face.stretch === (font.stretch ?? "normal") &&
      (font.unicodeRange === undefined || face.unicodeRange === font.unicodeRange)
    ) {
      return face;
    }
  }
  return undefined;
};

const notify = (entry: Entry, status: FontStatus): void => {
  entry.status = status;
  for (const listener of entry.listeners) listener();
};

const track = (key: string, entry: Entry, face: FontFace): void => {
  face.loaded.then(
    () => cache?.get(key) === entry && notify(entry, "loaded"),
    () => cache?.get(key) === entry && notify(entry, "error"),
  );
};

const createEntry = (key: string, font: FontSource): Entry => {
  const entry: Entry = {
    status: "loading",
    refs: 0,
    face: undefined,
    owned: false,
    listeners: new Set(),
  };
  const existing = findExisting(font);
  if (existing) {
    entry.face = existing;
    if (existing.status === "loaded") entry.status = "loaded";
    else if (existing.status === "error") entry.status = "error";
    else {
      track(key, entry, existing);
      if (existing.status === "unloaded") existing.load().catch(() => {});
    }
    return entry;
  }
  const face = new FontFace(font.family, toCssSrc(font.src), {
    weight: font.weight === undefined ? undefined : String(font.weight),
    style: font.style,
    stretch: font.stretch,
    unicodeRange: font.unicodeRange,
    display: font.display ?? "swap",
  });
  requests++;
  entry.face = face;
  entry.owned = true;
  document.fonts.add(face);
  track(key, entry, face);
  face.load().catch(() => {});
  return entry;
};

const release = (key: string, entry: Entry): void => {
  entry.refs--;
  // Deferred so StrictMode's unmount/remount and list re-keying don't refetch the font.
  queueMicrotask(() => {
    if (entry.refs > 0 || cache?.get(key) !== entry) return;
    cache.delete(key);
    if (entry.owned && entry.face) document.fonts.delete(entry.face);
  });
};

/**
 * Registers a listener for `font`, loading it on first use. Returns an unsubscribe
 * function; the font is removed from `document.fonts` once its last consumer leaves.
 */
export const subscribe = (key: string, font: FontSource, listener: () => void): (() => void) => {
  if (!canLoad()) return () => {};
  cache ??= new Map();
  let entry = cache.get(key);
  if (!entry) {
    entry = createEntry(key, font);
    cache.set(key, entry);
  }
  const current = entry;
  current.refs++;
  current.listeners.add(listener);
  return () => {
    current.listeners.delete(listener);
    release(key, current);
  };
};

/** Current status, without starting a load. Resolves already-loaded fonts immediately. */
export const getStatus = (key: string, font: FontSource): FontStatus => {
  const entry = cache?.get(key);
  if (entry) return entry.status;
  if (!canLoad()) return "loading";
  return findExisting(font)?.status === "loaded" ? "loaded" : "loading";
};

/** Number of font files requested so far. For tests and benchmarks. */
export const getRequestCount = (): number => requests;

/** Clears all cached fonts and counters. For tests and benchmarks. */
export const resetFontCache = (): void => {
  if (cache && canLoad()) {
    for (const entry of cache.values()) {
      if (entry.owned && entry.face) document.fonts.delete(entry.face);
    }
  }
  cache = undefined;
  requests = 0;
};
