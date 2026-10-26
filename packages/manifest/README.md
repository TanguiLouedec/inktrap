# @inktrapjs/manifest

The font manifest format shared by every [inktrap](https://github.com/TanguiLouedec/inktrap)
package: TypeScript types for describing a self-hosted font family, plus a few tiny helpers.
Zero dependencies, safe to use in the browser.

A manifest can be generated from your font files (by `@inktrapjs/cli` or `@inktrapjs/vite`) or
written by hand. Only `family` and `faces` are required.

```sh
npm install @inktrapjs/manifest
```

## The format

```ts
import type { FontManifest } from "@inktrapjs/manifest";

export const myFont: FontManifest = {
  schemaVersion: 1,
  family: "My Font",
  faces: [
    { family: "My Font", src: "/fonts/my-font-roman.woff2", weight: "100 900" },
    { family: "My Font", src: "/fonts/my-font-italic.woff2", weight: "100 900", style: "italic" },
  ],
  // Everything below is optional.
  version: "Version 1.000",
  designers: ["Jane Designer"],
  license: { name: "SIL Open Font License, Version 1.1", url: "https://openfontlicense.org" },
  metrics: { unitsPerEm: 2000, ascender: 1956, descender: -510, lineGap: 0, xHeight: 990, capHeight: 1400 },
  axes: [{ tag: "wght", name: "Weight", min: 100, default: 400, max: 900 }],
  instances: [{ name: "Bold", coordinates: { wght: 700 } }],
  features: [{ tag: "ss01", name: "Alternate a" }, { tag: "tnum" }],
};
```

| Field | Description |
|---|---|
| `schemaVersion` | Format version. Absent means `1`. |
| `family` | Typographic family name. |
| `faces` | The font files, as `FontSource` objects (`src` plus `FontFace` descriptors). Variable faces use a weight range like `"100 900"`. |
| `version`, `designers`, `designerUrl`, `copyright`, `license` | From the font's name table. |
| `metrics` | Vertical metrics in font units (`unitsPerEm`, `ascender`, `descender`, `lineGap`, `xHeight`, `capHeight`). |
| `axes` | Variation axes: `tag`, `name`, `min`, `default`, `max`, `hidden`. |
| `instances` | Named instances: `name`, `coordinates` (axis tag → value), `postScriptName`, `style` (the face it belongs to). |
| `features` | OpenType features: `tag`, plus `name` when the font names it (stylistic sets, character variants). |
| `glyphs` | Reserved for glyph data in a separate, lazily loaded file (planned for v0.3). |

**Compatibility:** new fields are only ever added as optional, and readers ignore fields they
don't know, so manifests you write today keep working. `schemaVersion` changes only for a
breaking change.

## Helpers

```ts
import { isFontManifest, selectFace, variationSettings } from "@inktrapjs/manifest";

selectFace(myFont, { weight: 700, style: "italic" }); // the italic face (its range covers 700)
variationSettings({ wght: 650, SOFT: 100 });           // '"wght" 650, "SOFT" 100'
isFontManifest(value);                                  // type guard
```

Readable feature labels live in a separate entry, so they are only bundled if you use them:

```ts
import { featureLabel, featureLabels } from "@inktrapjs/manifest/features";

featureLabel("tnum");                                 // "Tabular figures"
featureLabel({ tag: "ss01", name: "Alternate a" });   // "Alternate a" (the font's own name wins)
featureLabel("ss03");                                 // "Stylistic set 3"
```

## License

MIT. Fonts you describe stay under their own licenses.
