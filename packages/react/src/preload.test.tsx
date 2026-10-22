import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FontPreload, preloadFont } from "./preload";

const links = () => document.head.querySelectorAll('link[rel="preload"][as="font"]');

afterEach(() => {
  // Unmount first: React owns the links <FontPreload /> rendered.
  cleanup();
  for (const link of links()) link.remove();
});

describe("font preloading", () => {
  it("<FontPreload /> renders a crossorigin woff2 preload link", () => {
    render(<FontPreload src="/fonts/inter.woff2" />);
    // React 19 hoists <link> into <head>; React 18 leaves it in place.
    const link = document.querySelector('link[href="/fonts/inter.woff2"]') as HTMLLinkElement;
    expect(link.getAttribute("rel")).toBe("preload");
    expect(link.getAttribute("as")).toBe("font");
    expect(link.getAttribute("type")).toBe("font/woff2");
    expect(link.getAttribute("crossorigin")).toBe("anonymous");
  });

  it("preloadFont() adds one link per src", () => {
    preloadFont("/fonts/inter.woff2");
    preloadFont("/fonts/inter.woff2");
    preloadFont("/fonts/fraunces.woff2");
    expect(links()).toHaveLength(2);
    expect((links()[0] as HTMLLinkElement).crossOrigin).toBe("anonymous");
  });
});
