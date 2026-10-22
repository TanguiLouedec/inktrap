/**
 * Minimal stand-ins for the CSS Font Loading API, which jsdom doesn't implement.
 * Sources containing "fail" reject; everything else resolves on the next task.
 */
export class MockFontFace {
  family: string;
  source: string;
  weight: string;
  style: string;
  stretch: string;
  unicodeRange: string;
  display: string;
  status: FontFaceLoadStatus = "unloaded";
  readonly loaded: Promise<MockFontFace>;
  private settle!: (ok: boolean) => void;

  constructor(family: string, source: string, descriptors: FontFaceDescriptors = {}) {
    this.family = family;
    this.source = source;
    this.weight = descriptors.weight ?? "normal";
    this.style = descriptors.style ?? "normal";
    this.stretch = descriptors.stretch ?? "normal";
    this.unicodeRange = descriptors.unicodeRange ?? "U+0-10FFFF";
    this.display = descriptors.display ?? "auto";
    this.loaded = new Promise((resolve, reject) => {
      this.settle = (ok) => {
        this.status = ok ? "loaded" : "error";
        ok ? resolve(this) : reject(new Error(`failed to load ${source}`));
      };
    });
  }

  load(): Promise<MockFontFace> {
    if (this.status === "unloaded") {
      this.status = "loading";
      setTimeout(() => this.settle(!this.source.includes("fail")), 0);
    }
    return this.loaded;
  }

  /** Test helper: mark as already loaded (e.g. by a previous page). */
  markLoaded(): this {
    this.settle(true);
    return this;
  }
}

export class MockFontFaceSet {
  readonly faces = new Set<MockFontFace>();
  add(face: MockFontFace) {
    this.faces.add(face);
    return this;
  }
  delete(face: MockFontFace) {
    return this.faces.delete(face);
  }
  [Symbol.iterator]() {
    return this.faces.values();
  }
}

export const installFontMocks = (): MockFontFaceSet => {
  const set = new MockFontFaceSet();
  Object.defineProperty(globalThis, "FontFace", { value: MockFontFace, configurable: true, writable: true });
  Object.defineProperty(document, "fonts", { value: set, configurable: true });
  return set;
};

export const fontSet = (): MockFontFaceSet => document.fonts as unknown as MockFontFaceSet;
