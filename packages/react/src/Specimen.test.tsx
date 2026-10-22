import { act, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fontSet } from "../test/fontMocks";
import { getRequestCount } from "./fontCache";
import { Specimen } from "./Specimen";
import { useFontFace } from "./useFontFace";

// Spy on the hook to count how often <Specimen /> actually renders.
vi.mock("./useFontFace", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./useFontFace")>();
  return { useFontFace: vi.fn(mod.useFontFace) };
});

const font = { family: "Fraunces", src: "/fonts/fraunces.woff2" };

describe("<Specimen />", () => {
  it("renders the default text in the font, with nothing but the font applied", () => {
    render(<Specimen font={font} />);
    const el = screen.getByText("The quick brown fox jumps over the lazy dog");
    expect(el.getAttribute("style")).toBe('font-family: "Fraunces";');
    expect(el.className).toBe("");
  });

  it("applies text, size, fallback and passes className/style/attributes through", () => {
    render(
      <Specimen
        font={font}
        text="Hamburgefonstiv"
        size={48}
        fallback="Georgia, serif"
        className="hero"
        style={{ color: "red" }}
        id="s1"
      />,
    );
    const el = screen.getByText("Hamburgefonstiv");
    expect(el.className).toBe("hero");
    expect(el.id).toBe("s1");
    expect(el.style.fontFamily).toBe('"Fraunces", Georgia, serif');
    expect(el.style.fontSize).toBe("48px");
    expect(el.style.color).toBe("red");
  });

  it("exposes the loading status as a data attribute", async () => {
    render(<Specimen font={font} text="x" />);
    const el = screen.getByText("x");
    expect(el.dataset.inktrapStatus).toBe("loading");
    await waitFor(() => expect(el.dataset.inktrapStatus).toBe("loaded"));
  });

  it("does not re-render when an unrelated parent state changes", () => {
    let bump = () => {};
    const Parent = () => {
      const [n, setN] = useState(0);
      bump = () => setN((v) => v + 1);
      return (
        <>
          <span>{n}</span>
          <Specimen font={{ family: "Fraunces", src: "/fonts/fraunces.woff2" }} style={{ color: "red" }} />
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

  it("requests each font file exactly once for 200 specimens sharing 3 fonts", async () => {
    const names = ["a", "b", "c"];
    const items = Array.from({ length: 200 }, (_, i) => ({ id: `#${i}`, name: names[i % 3] }));
    render(
      <div>
        {items.map(({ id, name }) => (
          // A fresh object per specimen: deduplication must not rely on identity.
          <Specimen key={id} font={{ family: `Font ${name}`, src: `/fonts/${name}.woff2` }} text={id} />
        ))}
      </div>,
    );
    expect(getRequestCount()).toBe(3);
    expect(fontSet().faces.size).toBe(3);
    await waitFor(() => expect(screen.getByText("#199").dataset.inktrapStatus).toBe("loaded"));
    expect(getRequestCount()).toBe(3);
  });
});
