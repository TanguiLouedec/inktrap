import type { FontManifest } from "@inktrapjs/manifest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { fontSet } from "../test/fontMocks";
import { Specimen } from "./Specimen";
import { useFontFace } from "./useFontFace";
import { Waterfall } from "./Waterfall";

vi.mock("./useFontFace", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./useFontFace")>();
  return { useFontFace: vi.fn(mod.useFontFace) };
});

const fraunces: FontManifest = {
  family: "Fraunces",
  faces: [
    { family: "Fraunces", src: "/fonts/roman.woff2", weight: "100 900" },
    { family: "Fraunces", src: "/fonts/italic.woff2", weight: "100 900", style: "italic" },
  ],
  instances: [
    { name: "Bold", coordinates: { opsz: 9, wght: 700, SOFT: 0 } },
    { name: "Light Italic", coordinates: { wght: 300 }, style: "italic" },
  ],
};

const loadedSources = () =>
  [...fontSet().faces].map((face) => (face as unknown as { source: string }).source);

describe("components with a manifest", () => {
  it("loads only the upright face by default, with no extra CSS", async () => {
    render(<Specimen font={fraunces} text="x" />);
    const el = screen.getByText("x");
    expect(el.getAttribute("style")).toBe('font-family: "Fraunces";');
    expect(loadedSources()).toEqual(['url("/fonts/roman.woff2")']);
    await waitFor(() => expect(el.dataset.inktrapStatus).toBe("loaded"));
  });

  it("selects a face with `face` and sets the CSS that picks it", () => {
    render(<Specimen font={fraunces} face={{ style: "italic", weight: 650 }} text="x" />);
    const el = screen.getByText("x");
    expect(el.style.fontStyle).toBe("italic");
    expect(el.style.fontWeight).toBe("650");
    expect(loadedSources()).toEqual(['url("/fonts/italic.woff2")']);
  });

  it("applies a named instance with font-variation-settings", () => {
    render(<Specimen font={fraunces} instance="Bold" text="b" />);
    const bold = screen.getByText("b");
    expect(bold.style.fontWeight).toBe("700");
    expect(bold.style.fontVariationSettings).toBe('"opsz" 9, "wght" 700, "SOFT" 0');
    render(<Specimen font={fraunces} instance="Light Italic" text="li" />);
    expect(screen.getByText("li").style.fontStyle).toBe("italic");
    expect(loadedSources()).toEqual(['url("/fonts/roman.woff2")', 'url("/fonts/italic.woff2")']);
  });

  it("lets `style` override the face CSS, and ignores unknown instances", () => {
    render(<Specimen font={fraunces} instance="Bold" style={{ fontWeight: 300 }} text="a" />);
    expect(screen.getByText("a").style.fontWeight).toBe("300");
    render(<Specimen font={fraunces} instance="Nope" text="n" />);
    expect(screen.getByText("n").getAttribute("style")).toBe('font-family: "Fraunces";');
  });

  it("requests an empty source for a manifest without faces (browsers report it as an error)", () => {
    render(<Specimen font={{ family: "Empty", faces: [] }} text="e" />);
    expect(screen.getByText("e").style.fontFamily).toBe('"Empty"');
    expect(loadedSources()).toEqual([""]);
  });

  it("does not re-render for the same manifest and an inline face equal by value", () => {
    let bump = () => {};
    const Parent = () => {
      const [n, setN] = useState(0);
      bump = () => setN((v) => v + 1);
      return (
        <>
          <span>{n}</span>
          <Specimen font={fraunces} face={{ style: "italic" }} />
        </>
      );
    };
    render(<Parent />);
    const renders = vi.mocked(useFontFace).mock.calls.length;
    act(() => bump());
    expect(screen.getByText("1")).toBeTruthy();
    expect(vi.mocked(useFontFace).mock.calls.length).toBe(renders);
  });

  it("works in <Waterfall /> too", () => {
    const { container } = render(<Waterfall font={fraunces} instance="Bold" sizes={[12]} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.fontVariationSettings).toBe('"opsz" 9, "wght" 700, "SOFT" 0');
    expect(root.style.fontFamily).toBe('"Fraunces"');
  });

  it("server-renders the face CSS", () => {
    expect(renderToString(<Specimen font={fraunces} face={{ style: "italic" }} text="Hi" />)).toBe(
      '<div style="font-style:italic;font-family:&quot;Fraunces&quot;" data-inktrap-status="loading">Hi</div>',
    );
  });
});
