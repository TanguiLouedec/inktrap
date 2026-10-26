# @inktrapjs/core

Reads font files into [inktrap](https://github.com/TanguiLouedec/inktrap) font manifests: family
and designer names, license, version, vertical metrics, variation axes, named instances and
OpenType features (with stylistic set names when the font provides them). TTF, OTF, WOFF and
WOFF2 are supported, parsed with [fontkit](https://github.com/foliojs/fontkit).

**Node only.** This package is for build steps: the CLI (`@inktrapjs/cli`) and the Vite plugin
(`@inktrapjs/vite`) use it. Nothing from it reaches the browser; components read the JSON
manifests it produces, typed by `@inktrapjs/manifest`.

```sh
npm install -D @inktrapjs/core
```

## Usage

```ts
import { readFontManifest, readFontManifests } from "@inktrapjs/core";

// Files of one family become one manifest with one face per file.
const fraunces = await readFontManifest(
  ["fonts/Fraunces-Roman-VF.woff2", "fonts/Fraunces-Italic-VF.woff2"],
  { src: (path) => `/fonts/${path.split("/").pop()}` },
);

fraunces.faces;
// [{ family: "Fraunces", src: "/fonts/Fraunces-Roman-VF.woff2", weight: "100 900" },
//  { family: "Fraunces", src: "/fonts/Fraunces-Italic-VF.woff2", weight: "100 900", style: "italic" }]
fraunces.axes;      // [{ tag: "opsz", name: "Optical Size", min: 9, default: 9, max: 144 }, …]
fraunces.instances; // [{ name: "Thin", coordinates: { opsz: 9, wght: 100, … }, postScriptName: "Fraunces-Thin" }, …]

// Any mix of files: one manifest per family.
const manifests = await readFontManifests(paths);
```

- **`readFontManifests(paths, options?)`** returns one manifest per family (typographic family
  name, name ID 16, falling back to ID 1), in the order families first appear.
- **`readFontManifest(paths, options?)`** is the same for a single family, and throws if the files
  span several.
- **`options.src(path)`** maps each file path to the URL written to the face's `src`. Defaults to
  the path itself.
- **`readFontFile(path)`** reads one file without grouping.
- Failures throw a `FontReadError` with the offending `path`.

How the manifest is built:

- Each file becomes a face. Variable fonts get ranges taken from their axes
  (`weight: "100 900"`, `stretch: "75% 125%"`); static fonts use the OS/2 weight and width
  classes. `style` is `"italic"` or `"oblique"` from the font's style bits; normal values are
  left out.
- Files with identical descriptors are the same face in several formats and share one face,
  with `src` listing the files smallest format first (woff2, woff, then ttf/otf).
- Names, license, version and metrics come from the face a browser would use for regular text
  (upright, closest to weight 400). Metrics are the typographic ones when the font sets
  `USE_TYPO_METRICS`, otherwise `hhea`.
- Axes are merged across faces (lowest `min`, highest `max`); instances and features are the
  union. Instances of italic faces carry `style: "italic"`.

Font collections (`.ttc`, `.dfont`) are not supported.

## License

MIT. Fonts you read stay under their own licenses.
