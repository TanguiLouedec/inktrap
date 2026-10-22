import { expect, test } from "vitest";
import * as cache from "./fontCache";

// Bound once: reading ESM export getters in a hot loop skews results.
const { fontKey, getRequestCount, getStatus, resetFontCache, subscribe } = cache;

const font = { family: "Inter", src: "/fonts/inter.woff2", weight: 400 };
const noop = () => {};

// Mirrors what 1000 mounted components do: read the snapshot, then subscribe.
const mountUnmount1000 = () => {
  const key = fontKey(font);
  const unsubs: Array<() => void> = [];
  for (let i = 0; i < 1000; i++) {
    getStatus(key, font);
    unsubs.push(subscribe(key, font, noop));
  }
  if (getRequestCount() !== 1) throw new Error(`expected 1 request, got ${getRequestCount()}`);
  for (const unsub of unsubs) unsub();
  resetFontCache();
};

test("font cache: many consumers of the same font", async ({ bench }) => {
  const result = await bench("1000 consumers subscribe to one font", mountUnmount1000).run();
  expect(result.state).toBe("completed");

  await bench("fontKey for an inline source", () => {
    fontKey({ family: "Inter", src: "/fonts/inter.woff2", weight: 400, style: "italic" });
  }).run();
});
