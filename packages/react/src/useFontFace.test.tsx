import { act, render, renderHook, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { fontSet, MockFontFace } from "../test/fontMocks";
import { getRequestCount } from "./fontCache";
import type { FontSource } from "./types";
import { useFontFace } from "./useFontFace";

const inter: FontSource = { family: "Inter", src: "/fonts/inter.woff2" };

const flushMicrotasks = () => act(async () => {});

describe("useFontFace", () => {
  it("goes from loading to loaded and returns the family", async () => {
    const { result } = renderHook(() => useFontFace(inter));
    expect(result.current).toEqual({ status: "loading", family: "Inter" });
    await waitFor(() => expect(result.current.status).toBe("loaded"));
    expect(result.current.family).toBe("Inter");
  });

  it("reports errors", async () => {
    const { result } = renderHook(() => useFontFace({ family: "Broken", src: "/fail.woff2" }));
    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("passes descriptors through and defaults display to swap", () => {
    renderHook(() =>
      useFontFace({
        family: "Inter",
        src: ["/a.woff2", 'local("Inter")'],
        weight: 700,
        style: "italic",
        stretch: "condensed",
        unicodeRange: "U+0000-00FF",
      }),
    );
    const [face] = fontSet();
    expect(face).toMatchObject({
      family: "Inter",
      source: 'url("/a.woff2"), local("Inter")',
      weight: "700",
      style: "italic",
      stretch: "condensed",
      unicodeRange: "U+0000-00FF",
      display: "swap",
    });
  });

  it("loads a shared source once, even with inline objects and StrictMode", async () => {
    const Consumer = () => {
      useFontFace({ family: "Inter", src: "/fonts/inter.woff2" });
      return null;
    };
    const { rerender } = render(
      <StrictMode>
        <Consumer />
        <Consumer />
      </StrictMode>,
    );
    rerender(
      <StrictMode>
        <Consumer />
        <Consumer />
        <Consumer />
      </StrictMode>,
    );
    await flushMicrotasks();
    expect(getRequestCount()).toBe(1);
    expect(fontSet().faces.size).toBe(1);
  });

  it("treats different descriptors as different fonts", () => {
    renderHook(() => useFontFace(inter));
    renderHook(() => useFontFace({ ...inter, weight: 700 }));
    expect(getRequestCount()).toBe(2);
  });

  it("keeps a font while any consumer remains and removes it after the last", async () => {
    const a = renderHook(() => useFontFace(inter));
    const b = renderHook(() => useFontFace(inter));
    a.unmount();
    await flushMicrotasks();
    expect(fontSet().faces.size).toBe(1);
    b.unmount();
    await flushMicrotasks();
    expect(fontSet().faces.size).toBe(0);
  });

  it("resolves immediately when the font is already in document.fonts", async () => {
    const existing = new MockFontFace("Inter", 'url("/elsewhere.woff2")').markLoaded();
    await existing.loaded;
    fontSet().add(existing);

    const statuses: string[] = [];
    const { unmount } = renderHook(() => {
      const { status } = useFontFace(inter);
      statuses.push(status);
      return status;
    });
    expect(statuses[0]).toBe("loaded");
    expect(statuses).not.toContain("loading");
    expect(getRequestCount()).toBe(0);

    unmount();
    await flushMicrotasks();
    // Faces we didn't add are left alone.
    expect(fontSet().faces.has(existing)).toBe(true);
  });

  it("renders deterministic server markup and hydrates without mismatch", async () => {
    const Probe = () => <span>{useFontFace(inter).status}</span>;
    const html = renderToString(<Probe />);
    expect(html).toBe("<span>loading</span>");
    expect(getRequestCount()).toBe(0);

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const onRecoverableError = vi.fn();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      hydrateRoot(container, <Probe />, { onRecoverableError });
    });
    await waitFor(() => expect(container.textContent).toBe("loaded"));
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
    container.remove();
  });
});
