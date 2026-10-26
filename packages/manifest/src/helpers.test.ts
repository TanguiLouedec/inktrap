import { featureLabel, featureLabels } from "./features";
import { isFontManifest, selectFace, variationSettings } from "./index";
import type { FontManifest } from "./types";

const roman = { family: "Fraunces", src: "/f/roman.woff2", weight: "100 900" };
const italic = { family: "Fraunces", src: "/f/italic.woff2", weight: "100 900", style: "italic" };
const regular = { family: "Static", src: "/s/regular.woff2", weight: 400 };
const bold = { family: "Static", src: "/s/bold.woff2", weight: "bold" };
const light = { family: "Static", src: "/s/light.woff2", weight: 300 };

const variable: FontManifest = { family: "Fraunces", faces: [roman, italic] };
const statics: FontManifest = { family: "Static", faces: [light, regular, bold] };

describe("isFontManifest", () => {
  it("accepts a minimal hand-written manifest", () => {
    expect(isFontManifest({ family: "X", faces: [] })).toBe(true);
  });

  it("rejects a FontSource and non-objects", () => {
    expect(isFontManifest(roman)).toBe(false);
    expect(isFontManifest(null)).toBe(false);
    expect(isFontManifest("Fraunces")).toBe(false);
  });
});

describe("selectFace", () => {
  it("defaults to the normal style at weight 400", () => {
    expect(selectFace(variable)).toBe(roman);
    expect(selectFace(statics)).toBe(regular);
  });

  it("matches style, and weight within a variable range", () => {
    expect(selectFace(variable, { style: "italic", weight: 650 })).toBe(italic);
  });

  it("picks the closest static weight, including keywords", () => {
    expect(selectFace(statics, { weight: 700 })).toBe(bold);
    expect(selectFace(statics, { weight: 900 })).toBe(bold);
    expect(selectFace(statics, { weight: 100 })).toBe(light);
  });

  it("falls back to any face when no face has the style", () => {
    expect(selectFace(statics, { style: "italic", weight: 700 })).toBe(bold);
  });

  it("returns undefined for a manifest without faces", () => {
    expect(selectFace({ family: "Empty", faces: [] })).toBeUndefined();
  });
});

describe("variationSettings", () => {
  it("formats coordinates as CSS", () => {
    expect(variationSettings({ wght: 600, SOFT: 50 })).toBe('"wght" 600, "SOFT" 50');
  });

  it("returns normal for no coordinates", () => {
    expect(variationSettings({})).toBe("normal");
  });
});

describe("featureLabel", () => {
  it("prefers the font's own name", () => {
    expect(featureLabel({ tag: "ss01", name: "Single-storey a" })).toBe("Single-storey a");
  });

  it("uses the registry label, then numbered sets, then the tag", () => {
    expect(featureLabel("tnum")).toBe(featureLabels.tnum);
    expect(featureLabel({ tag: "ss07" })).toBe("Stylistic set 7");
    expect(featureLabel("cv12")).toBe("Character variant 12");
    expect(featureLabel("xyzw")).toBe("xyzw");
  });
});
