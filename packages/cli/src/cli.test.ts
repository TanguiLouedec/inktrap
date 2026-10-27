import { cp, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FontManifest } from "@inktrapjs/manifest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildManifests, run } from "./index";

const fixtures = join(import.meta.dirname, "..", "..", "core", "test", "fixtures");

let tmp: string;
let fonts: string;
let out: string;

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), "inktrap-cli-"));
  fonts = join(tmp, "fonts");
  out = join(tmp, "out");
  // fraunces/ and space-grotesk/, each with an OFL.txt that must be skipped.
  await cp(fixtures, fonts, { recursive: true });
  await rm(join(fonts, "build.py"));
  await rm(join(fonts, "README.md"));
});

afterEach(async () => {
  await rm(tmp, { recursive: true, force: true });
});

const readJson = async (path: string): Promise<FontManifest> => JSON.parse(await readFile(path, "utf8"));

const io = () => {
  const output = { stdout: "", stderr: "" };
  return {
    output,
    io: {
      version: "1.2.3",
      stdout: (text: string) => {
        output.stdout += text;
      },
      stderr: (text: string) => {
        output.stderr += text;
      },
    },
  };
};

describe("buildManifests", () => {
  it("writes one manifest per family, named after the family", async () => {
    const written = await buildManifests({ dir: fonts, out });
    expect(written.map((w) => w.manifest.family)).toEqual(["Fraunces", "Space Grotesk"]);
    expect((await readdir(out)).sort()).toEqual(["fraunces.json", "space-grotesk.json"]);
    const fraunces = await readJson(join(out, "fraunces.json"));
    expect(fraunces.faces).toHaveLength(2);
    expect(fraunces.axes?.map((a) => a.tag)).toEqual(["opsz", "wght", "SOFT", "WONK"]);
  });

  it("writes src as paths relative to the font folder by default", async () => {
    await buildManifests({ dir: fonts, out });
    const fraunces = await readJson(join(out, "fraunces.json"));
    expect(fraunces.faces.map((f) => f.src)).toEqual([
      "fraunces/Fraunces-Roman-VF.ttf",
      "fraunces/Fraunces-Italic-VF.woff2",
    ]);
  });

  it("prefixes src with the base URL", async () => {
    await buildManifests({ dir: fonts, out, baseUrl: "https://cdn.example.com/fonts" });
    const grotesk = await readJson(join(out, "space-grotesk.json"));
    expect(grotesk.faces[0]?.src).toBe("https://cdn.example.com/fonts/space-grotesk/SpaceGrotesk-Bold.woff");
  });

  it("URL-encodes file names", async () => {
    await cp(join(fonts, "space-grotesk"), join(fonts, "Space Grotesk"), { recursive: true });
    await rm(join(fonts, "space-grotesk"), { recursive: true });
    await buildManifests({ dir: fonts, out, baseUrl: "/fonts/" });
    const grotesk = await readJson(join(out, "space-grotesk.json"));
    expect(grotesk.faces[0]?.src).toBe("/fonts/Space%20Grotesk/SpaceGrotesk-Bold.woff");
  });

  it("writes formatted JSON with a trailing newline", async () => {
    await buildManifests({ dir: fonts, out });
    const text = await readFile(join(out, "space-grotesk.json"), "utf8");
    expect(text).toMatch(/^\{\n {2}"schemaVersion": 1,/);
    expect(text.endsWith("}\n")).toBe(true);
  });

  it.each([
    ["is missing", "nope"],
    ["is a file", join("fraunces", "OFL.txt")],
  ])("throws when the folder %s", async (_, path) => {
    await expect(buildManifests({ dir: join(fonts, path), out })).rejects.toThrow(/is not a folder$/);
  });

  it("throws when the folder has no font files", async () => {
    const empty = join(tmp, "empty");
    await cp(join(fonts, "fraunces", "OFL.txt"), join(empty, "OFL.txt"));
    await expect(buildManifests({ dir: empty, out })).rejects.toThrow(/No font files/);
  });
});

describe("run", () => {
  it("builds and reports each manifest", async () => {
    const { output, io: streams } = io();
    expect(await run(["build", fonts, "--out", out], streams)).toBe(0);
    expect(output.stdout).toContain("fraunces.json (Fraunces, 2 faces)");
    expect(output.stdout).toContain("space-grotesk.json (Space Grotesk, 1 face)");
    expect(output.stderr).toBe("");
  });

  it("passes --base-url through", async () => {
    const { io: streams } = io();
    expect(await run(["build", fonts, "-o", out, "--base-url", "/assets/"], streams)).toBe(0);
    const grotesk = await readJson(join(out, "space-grotesk.json"));
    expect(grotesk.faces[0]?.src).toBe("/assets/space-grotesk/SpaceGrotesk-Bold.woff");
  });

  it("prints help", async () => {
    const { output, io: streams } = io();
    expect(await run(["--help"], streams)).toBe(0);
    expect(output.stdout).toContain("inktrap build <dir> --out <dir>");
  });

  it("prints the version", async () => {
    const { output, io: streams } = io();
    expect(await run(["--version"], streams)).toBe(0);
    expect(output.stdout).toBe("1.2.3\n");
  });

  it.each([
    [[], /missing command/],
    [["bundle"], /unknown command "bundle"/],
    [["build"], /missing <dir>/],
    [["build", "fonts"], /--out is required/],
    [["build", "fonts", "--out", "x", "--nope"], /Unknown option '--nope'/],
  ])("rejects %j as a usage error", async (argv, message) => {
    const { output, io: streams } = io();
    expect(await run(argv, streams)).toBe(2);
    expect(output.stderr).toMatch(message);
    expect(output.stderr).toContain("inktrap --help");
  });

  it("reports unreadable fonts with their path and exits 1", async () => {
    await writeFile(join(fonts, "broken.woff2"), "not a font");
    const { output, io: streams } = io();
    expect(await run(["build", fonts, "--out", out], streams)).toBe(1);
    expect(output.stderr).toContain("broken.woff2");
  });
});
