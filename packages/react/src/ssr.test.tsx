// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FontPreload, preloadFont, Specimen, Waterfall } from "./index";

describe("server rendering", () => {
  it("renders without document or FontFace", () => {
    expect(typeof document).toBe("undefined");
    const html = renderToString(<Specimen font={{ family: "Inter", src: "/inter.woff2" }} text="Hi" />);
    expect(html).toBe('<div style="font-family:&quot;Inter&quot;" data-inktrap-status="loading">Hi</div>');
  });

  it("renders a waterfall without document or FontFace", () => {
    const html = renderToString(
      <Waterfall font={{ family: "Inter", src: "/inter.woff2" }} sizes={[12, "2rem"]} text="Hi" />,
    );
    expect(html).toBe(
      '<div style="font-family:&quot;Inter&quot;" data-inktrap-status="loading" data-inktrap-waterfall="">' +
        '<div style="font-size:12px" data-inktrap-size="12">Hi</div>' +
        '<div style="font-size:2rem" data-inktrap-size="2rem">Hi</div></div>',
    );
  });

  it("renders preload links and no-ops preloadFont", () => {
    expect(renderToString(<FontPreload src="/inter.woff2" />)).toContain('rel="preload"');
    expect(() => preloadFont("/inter.woff2")).not.toThrow();
  });
});
