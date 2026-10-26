# @inktrapjs/manifest

## 0.1.1

### Patch Changes

- [#8](https://github.com/TanguiLouedec/inktrap/pull/8) [`ae6c1d5`](https://github.com/TanguiLouedec/inktrap/commit/ae6c1d5e1b98471c28a88dafc32716154d5e9c38) Thanks [@TanguiLouedec](https://github.com/TanguiLouedec)! - New package `@inktrapjs/manifest`: the font manifest format every inktrap package reads (family, faces, names, license, metrics, axes, named instances, OpenType features), with `isFontManifest`, `selectFace` and `variationSettings` helpers and readable feature labels in `@inktrapjs/manifest/features`. Zero dependencies.
  
  `@inktrapjs/react`: `FontSource` now lives in `@inktrapjs/manifest` and is re-exported unchanged, so existing imports keep working. `@inktrapjs/manifest` is the package's only dependency.
