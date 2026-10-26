---
"@inktrapjs/manifest": patch
"@inktrapjs/react": patch
---

New package `@inktrapjs/manifest`: the font manifest format every inktrap package reads (family, faces, names, license, metrics, axes, named instances, OpenType features), with `isFontManifest`, `selectFace` and `variationSettings` helpers and readable feature labels in `@inktrapjs/manifest/features`. Zero dependencies.

`@inktrapjs/react`: `FontSource` now lives in `@inktrapjs/manifest` and is re-exported unchanged, so existing imports keep working. `@inktrapjs/manifest` is the package's only dependency.
