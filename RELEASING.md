# Releasing

The `@inktrapjs/*` packages are versioned with [Changesets](https://github.com/changesets/changesets) and
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

### Lockstep versions

All `@inktrapjs/*` packages share one version (`"fixed": [["@inktrapjs/*"]]` in
`.changeset/config.json`): a changeset for any of them releases all of them at the same
version, so `@inktrapjs/react@x` always pairs with `@inktrapjs/manifest@x`. New packages start
at `0.0.0` in the repo and join the group's version on their first release.

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

A trusted publisher can only be added to a package that exists on npm, so a new package is
published once by hand at `0.0.0`. Do it from `main` right after the PR adding the package
merges, and finish all steps before merging the next Version Packages PR: the release job can't
publish a package without a trusted publisher, and it stops at the first failure.

1. **Publish `0.0.0`** in an interactive terminal (the 2FA browser approval needs one; it doesn't
   work through a non-interactive shell). Go in dependency order: `manifest` before `core`,
   `core` before `cli` and `vite`.

   ```sh
   git switch main && git pull --ff-only
   pnpm install --frozen-lockfile
   pnpm build && pnpm test && pnpm check:pack
   npm login
   cd packages/<name>
   pnpm pack                        # rewrites workspace:^ dependencies to real version ranges
   npm publish inktrapjs-<name>-0.0.0.tgz --provenance=false   # provenance only works from CI
   ```

2. **Approve the staged version.** npm stages the first publish of a new package: it publishes a
   public `0.0.0-stage` placeholder and holds `0.0.0` until a maintainer approves it.

   ```sh
   npm stage list @inktrapjs/<name>
   npm stage approve <stage-id>     # or npmjs.com → the package → Staged Packages → Approve
   ```

3. **Add the trusted publisher** (asks for 2FA), then check it:

   ```sh
   npm trust github @inktrapjs/<name> --file release.yml --repo TanguiLouedec/inktrap --allow-publish
   npm trust list @inktrapjs/<name>
   ```

   `--allow-publish` is required: Changesets publishes with `npm publish`, not `npm stage`. On
   npmjs.com → the package → Settings, also set "Require two-factor authentication and disallow
   tokens". The new configuration shows "Pending validation" and **expires unless a publish
   uses it within 48 hours**, so merge the Version Packages PR soon after.

4. **Release and verify.** Merge the Version Packages PR (with the admin bypass). The release job
   publishes every package of the group at the new version. Then install from npm in an empty
   folder:

   ```sh
   npm install @inktrapjs/react@latest @inktrapjs/<name>@latest react react-dom
   npm audit signatures            # every package: verified signatures and attestations
   ```

   A freshly published tarball can return 404 for a couple of minutes while the registry
   catches up; retry before treating it as a failed release.

If the release job fails with `E404 Not Found - PUT …/@inktrapjs%2f<name>`, the package has no
matching trusted publisher: fix it (step 3) and rerun the failed job with
`gh run rerun <run-id> --failed`. Changesets skips versions that are already on npm.
