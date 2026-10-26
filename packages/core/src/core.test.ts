import { copyFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FontReadError, readFontFile, readFontManifest, readFontManifests } from "./index";

const fixture = (path: string) => join(import.meta.dirname, "..", "test", "fixtures", path);
const roman = fixture("fraunces/Fraunces-Roman-VF.ttf");
const italic = fixture("fraunces/Fraunces-Italic-VF.woff2");
const grotesk = fixture("space-grotesk/SpaceGrotesk-Bold.woff");

describe("readFontFile", () => {
  it("reads names, license and version", async () => {
    const info = await readFontFile(roman);
    expect(info.family).toBe("Fraunces");
    expect(info.format).toBe("TTF");
    expect(info.version).toBe("Version 1.000;[b76b70a41]");
    expect(info.designers).toEqual(["Undercase Type", "Phaedra Charles", "Flavia Zimbardi"]);
    expect(info.copyright).toMatch(/^Copyright 2020 The Fraunces Project Authors/);
    expect(info.license).toEqual({
      name: expect.stringMatching(/SIL Open Font License, Version 1\.1/),
      url: "https://scripts.sil.org/OFL",
    });
  });

  it("reads metrics", async () => {
    expect((await readFontFile(roman)).metrics).toEqual({
      unitsPerEm: 2000,
      ascender: 1956,
      descender: -510,
      lineGap: 0,
      xHeight: 964,
      capHeight: 1400,
    });
  });

  it("reads variation axes with their names", async () => {
    expect((await readFontFile(roman)).axes).toEqual([
      { tag: "opsz", name: "Optical Size", min: 9, default: 9, max: 144 },
      { tag: "wght", name: "Weight", min: 100, default: 900, max: 900 },
      { tag: "SOFT", name: "Softness", min: 0, default: 0, max: 100 },
      { tag: "WONK", name: "Wonky", min: 0, default: 1, max: 1 },
    ]);
  });

  it("reads named instances with coordinates and PostScript names", async () => {
    const { instances } = await readFontFile(roman);
    expect(instances.map((i) => i.name)).toEqual(["Thin", "Light", "Regular", "SemiBold", "Bold", "Black"]);
    expect(instances[4]).toEqual({
      name: "Bold",
      coordinates: { opsz: 9, wght: 700, SOFT: 0, WONK: 1 },
      postScriptName: "Fraunces-Bold",
    });
  });

  it("reads OpenType features, with the font's own stylistic set names", async () => {
    expect((await readFontFile(roman)).features).toEqual([
      { tag: "case" },
      { tag: "liga" },
      { tag: "ss01", name: "Test set name" },
      { tag: "rvrn" },
      { tag: "kern" },
    ]);
  });

  it("derives FontFace descriptors: variable ranges, italic, static weights", async () => {
    expect((await readFontFile(roman)).descriptors).toEqual({ weight: "100 900" });
    expect((await readFontFile(italic)).descriptors).toEqual({ weight: "100 900", style: "italic" });
    expect((await readFontFile(grotesk)).descriptors).toEqual({ weight: 700 });
  });

  it("reads WOFF2 and WOFF files", async () => {
    const woff2 = await readFontFile(italic);
    expect(woff2.format).toBe("WOFF2");
    expect(woff2.instances[0]).toMatchObject({ name: "Thin Italic", style: "italic" });
    const woff = await readFontFile(grotesk);
    expect(woff.format).toBe("WOFF");
    expect(woff.family).toBe("Space Grotesk");
    expect(woff.designers).toEqual(["Florian Karsten"]);
    expect(woff.axes).toEqual([]);
    expect(woff.features.map((f) => f.tag)).toContain("tnum");
  });
});

describe("readFontManifests", () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), "inktrap-core-"));
  });
  afterAll(() => rm(dir, { recursive: true, force: true }));

  it("groups the files of one family into one manifest with several faces", async () => {
    const manifest = await readFontManifest([italic, roman]);
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.family).toBe("Fraunces");
    // Upright first, whatever the input order.
    expect(manifest.faces).toEqual([
      { family: "Fraunces", src: roman, weight: "100 900" },
      { family: "Fraunces", src: italic, weight: "100 900", style: "italic" },
    ]);
    expect(manifest.axes?.map((a) => a.tag)).toEqual(["opsz", "wght", "SOFT", "WONK"]);
    expect(manifest.instances).toHaveLength(12);
    expect(manifest.instances?.find((i) => i.name === "Bold Italic")?.style).toBe("italic");
    // Family-wide values come from the upright face.
    expect(manifest.metrics?.xHeight).toBe(964);
    expect(manifest.features?.find((f) => f.tag === "ss01")?.name).toBe("Test set name");
  });

  it("returns one manifest per family", async () => {
    const manifests = await readFontManifests([roman, grotesk, italic]);
    expect(manifests.map((m) => [m.family, m.faces.length])).toEqual([
      ["Fraunces", 2],
      ["Space Grotesk", 1],
    ]);
    const [, spaceGrotesk] = manifests;
    expect(spaceGrotesk?.axes).toBeUndefined();
    expect(spaceGrotesk?.instances).toBeUndefined();
    expect(spaceGrotesk?.metrics).toMatchObject({ unitsPerEm: 1000, capHeight: 700 });
  });

  it("merges one face in several formats into a src list, smallest format first", async () => {
    const copy = join(dir, "Fraunces-Roman-copy.ttf");
    await copyFile(roman, copy);
    const manifest = await readFontManifest([roman, copy], { src: (path) => `/fonts/${basename(path)}` });
    expect(manifest.faces).toEqual([
      {
        family: "Fraunces",
        src: ["/fonts/Fraunces-Roman-VF.ttf", "/fonts/Fraunces-Roman-copy.ttf"],
        weight: "100 900",
      },
    ]);
  });

  it("maps paths to URLs with the src option", async () => {
    const manifest = await readFontManifest(italic, {
      src: (path) => `https://cdn.example/${basename(path)}`,
    });
    expect(manifest.faces[0]?.src).toBe("https://cdn.example/Fraunces-Italic-VF.woff2");
  });

  it("readFontManifest rejects files from several families", async () => {
    await expect(readFontManifest([roman, grotesk])).rejects.toThrow(
      "Expected one font family, found 2: Fraunces, Space Grotesk",
    );
  });

  it("reports unreadable and non-font files with their path", async () => {
    const text = join(dir, "notes.ttf");
    await writeFile(text, "not a font");
    await expect(readFontFile(text)).rejects.toBeInstanceOf(FontReadError);
    await expect(readFontFile(text)).rejects.toMatchObject({ path: text });
    await expect(readFontFile(join(dir, "missing.ttf"))).rejects.toThrow(/Can't read .*missing\.ttf/);
  });
});
