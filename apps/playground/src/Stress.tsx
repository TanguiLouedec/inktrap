import { Specimen } from "@inktrap/react";
import { useEffect, useState } from "react";
import { fraunces, literata, spaceGrotesk } from "./fonts";

const fonts = [fraunces, spaceGrotesk, literata];
const items = Array.from({ length: 200 }, (_, i) => i);

/** Counts font file requests the browser actually made, per URL. */
const useFontRequests = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    const read = () => {
      const next: Record<string, number> = {};
      for (const entry of performance.getEntriesByType("resource")) {
        if (!entry.name.endsWith(".woff2")) continue;
        const path = new URL(entry.name).pathname;
        next[path] = (next[path] ?? 0) + 1;
      }
      setCounts(next);
    };
    const id = setInterval(read, 500);
    read();
    return () => clearInterval(id);
  }, []);
  return counts;
};

export function Stress() {
  const requests = useFontRequests();
  return (
    <>
      <h2>200 specimens sharing 3 fonts</h2>
      <p className="muted">Font requests seen by the browser (each should be 1):</p>
      <ul className="muted">
        {Object.entries(requests).map(([path, n]) => (
          <li key={path}>
            {path}: {n}
          </li>
        ))}
      </ul>
      <div className="grid">
        {items.map((i) => (
          <Specimen
            key={i}
            font={fonts[i % 3] ?? fraunces}
            size={18}
            fallback="system-ui"
            text={`Specimen #${i + 1}`}
          />
        ))}
      </div>
    </>
  );
}
