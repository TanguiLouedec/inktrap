import { useCallback, useMemo, useSyncExternalStore } from "react";
import { fontKey, getStatus, subscribe } from "./fontCache";
import type { FontSource, FontStatus } from "./types";

export interface FontFaceState {
  status: FontStatus;
  family: string;
}

const serverStatus = (): FontStatus => "loading";

/**
 * Loads `source` with the CSS Font Loading API and reports its status.
 *
 * Consumers of the same source share a single request. Loading starts after mount,
 * so server and hydration renders always report `"loading"`; fonts that are already
 * in `document.fonts` resolve to `"loaded"` before the first paint.
 */
export function useFontFace(source: FontSource): FontFaceState {
  const key = fontKey(source);
  // The key captures everything that matters, so inline `source` objects are fine.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on fontKey(source)
  const font = useMemo(() => source, [key]);
  const sub = useCallback((onChange: () => void) => subscribe(key, font, onChange), [key, font]);
  const snapshot = useCallback(() => getStatus(key, font), [key, font]);
  const status = useSyncExternalStore(sub, snapshot, serverStatus);
  return useMemo(() => ({ status, family: font.family }), [status, font.family]);
}
