# inktrap

Free, ready-made React components for type designers to showcase their own fonts — specimens,
glyph grids, type testers — **while self-hosting the font files**. No paid font CDN, no tracking,
no lock-in: you put your `.woff2` files on your own site and point the components at them.

inktrap never bundles fonts. Components receive font sources (URLs plus FontFace descriptors)
through props, load them with the browser's
[CSS Font Loading API](https://developer.mozilla.org/docs/Web/API/CSS_Font_Loading_API), and
render unstyled markup you can style however you like.

## Install

```sh
npm install @inktrapjs/react
# or: pnpm add @inktrapjs/react / yarn add @inktrapjs/react
```

React 18 or newer is required as a peer dependency. The only dependency is
[`@inktrapjs/manifest`](./packages/manifest) (types plus a few hundred bytes of helpers, itself
dependency-free).

## Usage

```tsx
import { Specimen } from "@inktrapjs/react";

const myFont = {
  family: "My Font",
  src: "/fonts/my-font-regular.woff2",
  weight: 400,
};

export function Hero() {
  return <Specimen font={myFont} text="Handgloves" size={96} fallback="Georgia, serif" className="hero" />;
}
```

`<Specimen />` renders a `<div>` with only `font-family` (and `font-size` if you pass `size`)
applied. Everything else — color, line height, layout — is yours. It also sets
`data-inktrap-status="loading" | "loaded" | "error"` so you can style each state in CSS.

### `<Waterfall />`

The same text at a range of sizes, the classic way to show how a face holds up from caption to
display:

```tsx
import { Waterfall } from "@inktrapjs/react";

<Waterfall font={myFont} text="Handgloves" fallback="Georgia, serif" />
<Waterfall font={myFont} sizes={[16, 24, "3rem", "5rem"]} />
```

`sizes` defaults to `defaultWaterfallSizes` (12, 14, 16, 20, 24, 32, 40, 48, 64, 80 and 96 px),
which is exported so you can extend it. Numbers are pixels; strings are any CSS length. The markup
is unstyled:

```html
<div style="font-family: &quot;My Font&quot;, Georgia, serif" data-inktrap-status="loaded" data-inktrap-waterfall>
  <div style="font-size: 12px" data-inktrap-size="12">Handgloves</div>
  <div style="font-size: 14px" data-inktrap-size="14">Handgloves</div>
  …
</div>
```

Style rows with `[data-inktrap-waterfall] > [data-inktrap-size]`, or label them with CSS, e.g.
`[data-inktrap-size]::before { content: attr(data-inktrap-size) "px"; }`. Like `<Specimen />`,
inline `font`, `style` and `sizes` props are compared by value, so re-rendering the parent is
cheap.

### `useFontFace(source)`

The hook behind every component, for building your own:

```tsx
import { useFontFace } from "@inktrapjs/react";

function Tester() {
  const { status, family } = useFontFace({ family: "My Font", src: "/fonts/my-font.woff2", weight: 700 });
  return <textarea style={{ fontFamily: `"${family}", sans-serif`, opacity: status === "loading" ? 0.6 : 1 }} />;
}
```

- `src` takes a URL, a full CSS `src` value (`url(...) format(...)`, `local(...)`), or an array of them.
- Descriptors `weight`, `style`, `stretch`, `unicodeRange` and `display` (default `"swap"`) are
  passed straight to `FontFace`.
- **Deduplicated:** every component asking for the same source + descriptors shares one
  `FontFace` and one network request. Fonts are reference-counted and removed from
  `document.fonts` only when their last consumer unmounts.
- **No flash for fonts that are already there:** if a matching face is already loaded in
  `document.fonts` (from a stylesheet or a previous page), the status is `"loaded"` on the first
  client render.
- **SSR-safe:** on the server and during hydration the status is always `"loading"`, so the markup is
  identical on both sides. Loading starts only after mount.

### Preloading

Start the download before React even renders, which is the biggest single win for font display time:

```tsx
import { FontPreload, preloadFont } from "@inktrapjs/react";

// In your document head (Next.js layout, Remix links, etc.). React 19 hoists it to <head> automatically.
<FontPreload src="/fonts/my-font-regular.woff2" />

// Or imperatively on the client:
preloadFont("/fonts/my-font-regular.woff2");
```

Both emit `<link rel="preload" as="font" type="font/woff2" crossorigin>`. Use **woff2**: it is
supported everywhere that matters and is the smallest format. `crossorigin` is required for font
preloads even on the same origin, or the browser downloads the file twice.

### Avoiding layout shift

While your font loads, the browser shows the `fallback` family. To stop text from jumping when the
real font arrives, define a fallback `@font-face` whose metrics are adjusted to match yours:

```css
@font-face {
  font-family: "My Font Fallback";
  src: local("Arial");
  size-adjust: 104%;       /* scale the fallback's glyphs to your font's average width */
  ascent-override: 92%;    /* your font's ascender / unitsPerEm */
  descent-override: 24%;   /* your font's descender / unitsPerEm */
  line-gap-override: 0%;
}
```

```tsx
<Specimen font={myFont} fallback='"My Font Fallback", Arial, sans-serif' />
```

You know your font's metrics best. Tools like [fontaine](https://github.com/unjs/fontaine) and
[Capsize](https://seek-oss.github.io/capsize/) can compute these values.

## Performance rules

inktrap runs on showcase sites where speed and visual stability are the product, so the main entry
follows strict rules:

- No third-party runtime dependencies: only `@inktrapjs/manifest`, which has none. React is the
  only peer.
- Named exports only, `sideEffects: false`, nothing runs on import. Each export tree-shakes on its
  own, and CI checks that.
- Size budgets, enforced in CI with size-limit: `useFontFace` + `<Specimen />` and `useFontFace` +
  `<Waterfall />` each stay under **2 kB min+gzip**.
- **Heavy features stay out of the main entry.** Anything that parses font files (glyph lists,
  OpenType feature tables, …) will ship as a separate subpath export such as
  `@inktrapjs/react/glyphs`, loaded lazily, so sites that only show specimens never pay for it.

## Local development

This is a pnpm workspace:

```
packages/react     @inktrapjs/react, the component library
packages/manifest  @inktrapjs/manifest, the font manifest format (types + tiny helpers)
packages/core      @inktrapjs/core, reads font files into manifests (Node only, fontkit)
apps/playground    Vite app for developing and eyeballing components
```

```sh
corepack enable          # uses the pnpm version pinned in package.json
pnpm install
pnpm dev                 # playground at http://localhost:5173 (#stress renders 200 specimens)
pnpm test                # Vitest + Testing Library
pnpm bench               # font cache benchmark
pnpm lint                # Biome (pnpm format to fix formatting)
pnpm typecheck
pnpm build
pnpm size                # size budgets + tree-shaking check (after build)
pnpm check:pack          # verify the npm tarball contents of every package (after build)
```

Every change to a published package ships with a changeset (`pnpm changeset`). The release workflow
turns them into a "Version Packages" PR, and merging it publishes to npm with provenance. See
[RELEASING.md](https://github.com/TanguiLouedec/inktrap/blob/main/RELEASING.md) for the
versioning policy and the one-time first-release setup.

The playground ships fonts under the SIL Open Font License (Fraunces, Space Grotesk, Literata);
each license sits next to its font in `apps/playground/public/fonts/`.

## License

[MIT](./LICENSE). Fonts you showcase stay under their own licenses.
