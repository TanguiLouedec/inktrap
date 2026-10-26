---
"@inktrapjs/core": patch
---

New package `@inktrapjs/core` (Node only): `readFontManifest` / `readFontManifests` read TTF, OTF, WOFF and WOFF2 files into font manifests (names, designers, license, version, metrics, variation axes, named instances, OpenType features with stylistic set names), grouping the files of a family into one manifest with one face per file. Parsing uses fontkit.
