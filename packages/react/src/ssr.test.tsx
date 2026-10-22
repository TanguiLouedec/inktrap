// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FontPreload, preloadFont, Specimen } from "./index";

describe("server rendering", () => {
  it("renders without document or FontFace", () => {
    expect(typeof document).toBe("undefined");
    const html = renderToString(<Specimen font={{ family: "Inter", src: "/inter.woff2" }} text="Hi" />);
    expect(html).toBe('<div style="font-family:&quot;Inter&quot;" data-inktrap-status="loading">Hi</div>');
  });

  it("renders preload links and no-ops preloadFont", () => {
    expect(renderToString(<FontPreload src="/inter.woff2" />)).toContain('rel="preload"');
    expect(() => preloadFont("/inter.woff2")).not.toThrow();
  });
});
