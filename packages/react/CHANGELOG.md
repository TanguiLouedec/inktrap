# @inktrapjs/react

## 0.1.2

### Patch Changes

- Updated dependencies [[`b5ac637`](https://github.com/TanguiLouedec/inktrap/commit/b5ac637f398fce6344c1bd71d759caa2767f7c2b)]:
  - @inktrapjs/manifest@0.1.2

## 0.1.1

### Patch Changes

- [#8](https://github.com/TanguiLouedec/inktrap/pull/8) [`ae6c1d5`](https://github.com/TanguiLouedec/inktrap/commit/ae6c1d5e1b98471c28a88dafc32716154d5e9c38) Thanks [@TanguiLouedec](https://github.com/TanguiLouedec)! - New package `@inktrapjs/manifest`: the font manifest format every inktrap package reads (family, faces, names, license, metrics, axes, named instances, OpenType features), with `isFontManifest`, `selectFace` and `variationSettings` helpers and readable feature labels in `@inktrapjs/manifest/features`. Zero dependencies.
  
  `@inktrapjs/react`: `FontSource` now lives in `@inktrapjs/manifest` and is re-exported unchanged, so existing imports keep working. `@inktrapjs/manifest` is the package's only dependency.

- [#9](https://github.com/TanguiLouedec/inktrap/pull/9) [`6d2751d`](https://github.com/TanguiLouedec/inktrap/commit/6d2751df2dc984b73ded56d1fb904f4017fea676) Thanks [@TanguiLouedec](https://github.com/TanguiLouedec)! - New `<Waterfall />`: renders the same text at a list of sizes (default `defaultWaterfallSizes`, 12–96 px, fully overridable), unstyled, with `data-inktrap-waterfall` on the wrapper and `data-inktrap-size` on each row. Inline `font`, `style` and `sizes` are compared by value, like `<Specimen />`.
- Updated dependencies [[`ae6c1d5`](https://github.com/TanguiLouedec/inktrap/commit/ae6c1d5e1b98471c28a88dafc32716154d5e9c38)]:
  - @inktrapjs/manifest@0.1.1

## 0.1.0

### Minor Changes

- [`ea444e3`](https://github.com/TanguiLouedec/inktrap/commit/ea444e3bb4ff68ad0880659db9fa859bee4a04b4) Thanks [@TanguiLouedec](https://github.com/TanguiLouedec)! - Initial release: `useFontFace` (deduplicated, ref-counted, SSR-safe font loading), `<Specimen />`, `<FontPreload />` and `preloadFont()`.
