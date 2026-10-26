import { act, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { getRequestCount } from "./fontCache";
import { useFontFace } from "./useFontFace";
import { defaultWaterfallSizes, Waterfall } from "./Waterfall";

// Spy on the hook to count how often <Waterfall /> actually renders.
vi.mock("./useFontFace", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./useFontFace")>();
  return { useFontFace: vi.fn(mod.useFontFace) };
});

const font = { family: "Fraunces", src: "/fonts/fraunces.woff2" };

const rows = (el: HTMLElement) => Array.from(el.children) as HTMLElement[];

describe("<Waterfall />", () => {
  it("renders the default text at the default sizes, with only the font and sizes applied", () => {
    const { container } = render(<Waterfall font={font} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("style")).toBe('font-family: "Fraunces";');
    expect(root.hasAttribute("data-inktrap-waterfall")).toBe(true);
    expect(rows(root).map((row) => row.dataset.inktrapSize)).toEqual(defaultWaterfallSizes.map(String));
    for (const row of rows(root)) {
      expect(row.textContent).toBe("The quick brown fox jumps over the lazy dog");
      expect(row.getAttribute("style")).toBe(`font-size: ${row.dataset.inktrapSize}px;`);
    }
  });

  it("takes custom sizes (numbers are pixels), text, fallback and passes attributes through", () => {
    const { container } = render(
      <Waterfall
        font={font}
        sizes={[10, "2rem", 10]}
        text="Hamburgefonstiv"
        fallback="Georgia, serif"
        className="waterfall"
        style={{ color: "red" }}
        id="w1"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toBe("waterfall");
    expect(root.id).toBe("w1");
    expect(root.style.fontFamily).toBe('"Fraunces", Georgia, serif');
    expect(root.style.color).toBe("red");
    expect(rows(root).map((row) => row.style.fontSize)).toEqual(["10px", "2rem", "10px"]);
    expect(screen.getAllByText("Hamburgefonstiv")).toHaveLength(3);
  });

  it("exposes the loading status as a data attribute and loads the font once", async () => {
    const { container } = render(<Waterfall font={font} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.inktrapStatus).toBe("loading");
    await waitFor(() => expect(root.dataset.inktrapStatus).toBe("loaded"));
    expect(getRequestCount()).toBe(1);
  });

  it("does not re-render for inline font, style and sizes that are equal by value", () => {
    let bump = () => {};
    const Parent = () => {
      const [n, setN] = useState(0);
      bump = () => setN((v) => v + 1);
      return (
        <>
          <span>{n}</span>
          <Waterfall
            font={{ family: "Fraunces", src: "/fonts/fraunces.woff2" }}
            sizes={[12, 24]}
            style={{ color: "red" }}
          />
        </>
      );
    };
    render(<Parent />);
    const renders = vi.mocked(useFontFace).mock.calls.length;
    act(() => bump());
    act(() => bump());
    expect(screen.getByText("2")).toBeTruthy();
    expect(vi.mocked(useFontFace).mock.calls.length).toBe(renders);
  });

  it("re-renders when the sizes change", () => {
    const { container, rerender } = render(<Waterfall font={font} sizes={[12, 24]} />);
    rerender(<Waterfall font={font} sizes={[12, 24, 48]} />);
    expect(rows(container.firstElementChild as HTMLElement)).toHaveLength(3);
  });
});
