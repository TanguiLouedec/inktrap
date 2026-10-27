---
"@inktrapjs/cli": patch
---

New package `@inktrapjs/cli`: `inktrap build <dir> --out <dir> [--base-url <url>]` reads every font file under a folder and writes one JSON manifest per family (`<family>.json`), with each face's `src` built from `--base-url` and the file's path. The same build is available from Node as `buildManifests({ dir, out, baseUrl })`.
