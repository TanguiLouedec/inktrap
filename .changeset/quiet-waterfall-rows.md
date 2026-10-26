---
"@inktrapjs/react": patch
---

New `<Waterfall />`: renders the same text at a list of sizes (default `defaultWaterfallSizes`, 12–96 px, fully overridable), unstyled, with `data-inktrap-waterfall` on the wrapper and `data-inktrap-size` on each row. Inline `font`, `style` and `sizes` are compared by value, like `<Specimen />`.
