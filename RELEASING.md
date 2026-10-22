# Releasing

`@inktrap/react` is versioned with [Changesets](https://github.com/changesets/changesets) and
published from GitHub Actions with npm Trusted Publishing (OIDC, with provenance, no tokens).

## Versioning policy

### 0.x until the API settles

- Breaking changes bump the **minor** (`0.1 → 0.2`). Features and fixes bump the **patch**.
- Never pick `major` in a changeset during 0.x: that releases `1.0.0`.
- 1.0 ships when the core set (`Specimen`, `useFontFace`, glyph grid, type tester) has been stable
  for a while and is running on real showcase sites. After that, strict semver.

### What counts as breaking

Designers style against the rendered output, so the public API is wider than the TypeScript types.

| Change | 0.x | ≥ 1.0 |
|---|---|---|
| Rename or remove an export, prop or descriptor | minor | major |
| Change the DOM output: element type, `data-inktrap-status` values, which inline style properties are set | minor | major |
| Change server-rendered markup (it can break hydration on users' sites) | minor | major |
| Narrow peer ranges (e.g. drop React 18) | minor | major |
| Change a default (`display: "swap"`, the sample text) | minor | major |
| Add an optional prop, export or subpath export (e.g. `/glyphs`) | patch | minor |
| Bug fix, or a performance change with identical output | patch | patch |
| Raise a size-limit budget | patch, and the changeset must say so | same |

### Deprecations

Mark the old API `@deprecated` and add a development-only warning (guarded by
`process.env.NODE_ENV !== "production"`) in one release, then remove it in the next breaking release.

### Support

During 0.x only the latest release line gets fixes.

### Future packages

When `packages/core` lands, version it in lockstep with `@inktrap/react` by adding
`"fixed": [["@inktrap/core", "@inktrap/react"]]` to `.changeset/config.json`.

## Day-to-day flow

1. In your PR, run `pnpm changeset` and describe the change for users. The CI `changeset` job
   fails if a published package changed without one; use `pnpm changeset --empty` for changes
   that shouldn't release.
2. When the PR merges, the Release workflow opens (or updates) a **Version Packages** PR that
   bumps versions and writes `CHANGELOG.md`.
3. Merging the Version Packages PR publishes to npm with provenance and pushes a git tag.

## Prereleases

```sh
pnpm changeset pre enter next   # on a `next` branch
pnpm changeset                  # as usual
pnpm changeset pre exit         # before merging back to main
```

Prereleases publish under the `next` dist-tag. For trying a PR build without publishing to npm,
use [pkg.pr.new](https://pkg.pr.new).

## First-time setup

npm can't attach a trusted publisher to a package that doesn't exist yet, so `0.1.0` is
published by hand once. Every release after that is automated.

1. **Create the GitHub repo** `TanguiLouedec/inktrap`, empty (no README, license or .gitignore),
   then push:

   ```sh
   git push -u origin main
   ```

2. **Let Actions open PRs:** repo Settings → Actions → General → Workflow permissions → tick
   "Allow GitHub Actions to create and approve pull requests".
   Then re-run the Release workflow (Actions tab), or push any commit. It opens a
   **Version Packages** PR bumping `@inktrap/react` to `0.1.0`. Don't merge it yet.

3. **Create the npm scope:** on npmjs.com, create the free organization `inktrap` so that you
   can publish `@inktrap/*`.

4. **Publish 0.1.0 by hand** from the Version Packages branch:

   ```sh
   git fetch origin
   git switch changeset-release/main
   pnpm install --frozen-lockfile
   pnpm build && pnpm test && pnpm check:pack
   npm login
   cd packages/react
   npm publish --provenance=false   # provenance only works from CI; later releases have it
   ```

5. **Link the trusted publisher:** npmjs.com → `@inktrap/react` → Settings → Trusted Publisher →
   GitHub Actions: owner `TanguiLouedec`, repository `inktrap`, workflow `release.yml`, no
   environment. Optionally also set "Require two-factor authentication and disallow tokens".

6. **Merge the Version Packages PR.** The Release workflow sees that 0.1.0 is already on npm and
   publishes nothing. Changesets only tags what it publishes, so tag this one yourself:

   ```sh
   git switch main && git pull
   git tag @inktrap/react@0.1.0
   git push origin @inktrap/react@0.1.0
   gh release create @inktrap/react@0.1.0 --notes-file packages/react/CHANGELOG.md
   ```

From here on, releases go through the day-to-day flow above.
