# @inktrapjs/cli

Turns a folder of font files into [inktrap](https://github.com/TanguiLouedec/inktrap) font
manifests: one JSON file per family, ready to pass to `<Specimen />` and `<Waterfall />`.
A thin wrapper over [`@inktrapjs/core`](../core).

```sh
npm install -D @inktrapjs/cli
```

## Usage

```sh
inktrap build public/fonts --out src/fonts --base-url /fonts/
```

```
wrote src/fonts/fraunces.json (Fraunces, 2 faces)
wrote src/fonts/space-grotesk.json (Space Grotesk, 1 face)
```

- Every `.ttf`, `.otf`, `.woff` and `.woff2` under `<dir>` is read, subfolders included. Files
  of the same family become one manifest with one face per file (see
  [`@inktrapjs/core`](../core#usage) for how faces are built).
- Each manifest is written to `<out>/<family>.json`, the family name in lowercase with
  hyphens: `Space Grotesk` → `space-grotesk.json`. Existing files are overwritten.
- `--base-url` is put in front of each font's path relative to `<dir>` to make the face's
  `src`: above, `public/fonts/fraunces/Fraunces-Roman.woff2` becomes
  `/fonts/fraunces/Fraunces-Roman.woff2`. Use the URL your fonts are served from: a path on
  your site or a CDN. Without it, `src` is the relative path alone, which the browser resolves
  against the page URL.
- Exit codes: `0` on success, `1` when a file can't be read (the message names it), `2` for
  usage errors.

Then import the JSON where you render:

```tsx
import { Specimen } from "@inktrapjs/react";
import fraunces from "./fonts/fraunces.json";

<Specimen font={fraunces} instance="Bold">Handgloves</Specimen>;
```

On Windows in Git Bash, a `--base-url` starting with `/` is rewritten into a Windows path
before the CLI sees it. Run the command from PowerShell, cmd or an npm script, or prefix it
with `MSYS_NO_PATHCONV=1`.

## From Node

```ts
import { buildManifests } from "@inktrapjs/cli";

const written = await buildManifests({ dir: "public/fonts", out: "src/fonts", baseUrl: "/fonts/" });
// [{ file: "src/fonts/fraunces.json", manifest: { family: "Fraunces", … } }, …]
```

`run(argv, { stdout, stderr, version })` runs the command line itself and resolves to the exit
code.

## License

MIT. Fonts you read stay under their own licenses.
