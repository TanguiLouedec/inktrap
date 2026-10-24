# Releasing

`@inktrapjs/react` is versioned with [Changesets](https://github.com/changesets/changesets) and
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

When `packages/core` lands, version it in lockstep with `@inktrapjs/react` by adding
`"fixed": [["@inktrapjs/core", "@inktrapjs/react"]]` to `.changeset/config.json`.

## Day-to-day flow

1. In your PR, run `pnpm changeset` and describe the change for users. The CI `changeset` job
   fails if a published package changed without one; use `pnpm changeset --empty` for changes
   that shouldn't release.
2. When the PR merges, the Release workflow opens (or updates) a **Version Packages** PR that
   bumps versions and writes `CHANGELOG.md`.
3. Merging the Version Packages PR (with the admin bypass, see below) publishes to npm with
   provenance, pushes a git tag and creates the GitHub release.

## Prereleases

```sh
pnpm changeset pre enter next   # on a `next` branch
pnpm changeset                  # as usual
pnpm changeset pre exit         # before merging back to main
```

Prereleases publish under the `next` dist-tag. For trying a PR build without publishing to npm,
use [pkg.pr.new](https://pkg.pr.new).

## Repository setup

Done for 0.1.0 (2026-10-24); kept here for reference.

- npm organization `inktrapjs` owns `@inktrapjs/*`. `@inktrapjs/react` has a trusted publisher:
  GitHub Actions, owner `TanguiLouedec`, repository `inktrap`, workflow `release.yml`, no
  environment.
- `main` is protected by a ruleset: changes land through squash-merged PRs with the `ci` and
  `changeset` checks passing; no force-pushes or deletion. Repository admins can bypass on PRs.
  The Version Packages PR is opened with `GITHUB_TOKEN`, so CI never runs on it: merge it with
  the bypass.
- Actions are pinned to commit SHAs; Dependabot keeps them and the dev dependencies up to date.
- Repo Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"
  is on, or changesets/action can't open the Version Packages PR.

### Adding a package

npm can't attach a trusted publisher to a package that doesn't exist yet, so publish the first
version by hand, then link it:

```sh
pnpm install --frozen-lockfile
pnpm build && pnpm test && pnpm check:pack
npm login
cd packages/<name>
npm publish --provenance=false   # provenance only works from CI; later releases have it
```

Run `npm publish` in an interactive terminal: the 2FA browser approval needs it. Then on
npmjs.com → the package → Settings → Trusted Publisher, add the same GitHub Actions publisher as
above, and set "Require two-factor authentication and disallow tokens". If the Version Packages
PR that bumped this version merges afterwards, Changesets publishes nothing and doesn't tag it,
so tag it yourself:

```sh
git tag @inktrapjs/<name>@<version>
git push origin @inktrapjs/<name>@<version>
gh release create @inktrapjs/<name>@<version> --notes-file packages/<name>/CHANGELOG.md
```
