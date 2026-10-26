# @inktrapjs/manifest

## 0.1.2

### Patch Changes

- [#12](https://github.com/TanguiLouedec/inktrap/pull/12) [`b5ac637`](https://github.com/TanguiLouedec/inktrap/commit/b5ac637f398fce6344c1bd71d759caa2767f7c2b) Thanks [@TanguiLouedec](https://github.com/TanguiLouedec)! - `FontSource.display` no longer depends on the DOM's global `FontDisplay` type, so the manifest types also check in Node-only projects. `FontDisplay` is exported, with the same values.

## 0.1.1

### Patch Changes

- [#8](https://github.com/TanguiLouedec/inktrap/pull/8) [`ae6c1d5`](https://github.com/TanguiLouedec/inktrap/commit/ae6c1d5e1b98471c28a88dafc32716154d5e9c38) Thanks [@TanguiLouedec](https://github.com/TanguiLouedec)! - New package `@inktrapjs/manifest`: the font manifest format every inktrap package reads (family, faces, names, license, metrics, axes, named instances, OpenType features), with `isFontManifest`, `selectFace` and `variationSettings` helpers and readable feature labels in `@inktrapjs/manifest/features`. Zero dependencies.
  
  `@inktrapjs/react`: `FontSource` now lives in `@inktrapjs/manifest` and is re-exported unchanged, so existing imports keep working. `@inktrapjs/manifest` is the package's only dependency.
