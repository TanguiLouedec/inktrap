---
"@inktrapjs/react": patch
---

`<Specimen />` and `<Waterfall />` accept a font manifest (`FontManifest`) as well as a single `FontSource`. Choose the face with `face={{ weight, style }}` or a named instance with `instance="Bold Italic"`: only that face is loaded, and the component sets `font-weight`, `font-style` and, for instances, `font-variation-settings` (your `style` prop overrides them). Output for a plain `FontSource` is unchanged. `FontManifest`, `FaceQuery`, `FontInput` and `FaceSelection` types are exported. Bundle size: `useFontFace` + `Specimen` 1.21 → 1.66 kB, `useFontFace` + `Waterfall` 1.33 → 1.78 kB (budgets unchanged at 2 kB).
