# LikeC4 Explorer — a fork of LikeC4

A community fork of **[likec4/likec4](https://github.com/likec4/likec4)** (MIT,
© Denis Davydkov) with improvements to the generated SPA's navigation panel and
the Overview page.

> Not affiliated with or endorsed by the upstream LikeC4 maintainers. All upstream
> copyright notices, the `LICENSE` (MIT), and `THIRD-PARTY-NOTICES.txt` are preserved.

## What's different from upstream

- **Overview as a folder explorer** — browse the view hierarchy as folder tiles
  (with a peek of the next level) + view cards; drill-down and breadcrumbs; the
  current folder is in the URL (`?folder=…`, deep-linkable).
- **Unified sidebar** — single navigation panel grouped by the native view folders
  (`views '<folder>'`), with **By folders / List** modes; clickable leaves (open the
  diagram), clicking a folder shows that level in the Overview, and the sidebar
  selection/expansion stays in sync with the Overview.
- **Pinnable, dockable sidebar** — keep the panel docked and always visible.
- **One navigation entry** — an explicit menu button opens the panel; the logo is
  inert; the special `index` UX is dropped (single project always lands on the
  Overview).
- **Element action icons have tooltips**; canvas cursor stays visible at non‑100%
  browser zoom.

Authoring rules to get the most out of these are described in the consuming
project's handbook (`rules-likec4/spa-authoring.md`): group views with
`views '<folder>'`, give each view a `title` and `description`, and define an
explicit `view index`.

## Install (via pkg.pr.new — no npm publish)

This fork is distributed through [pkg.pr.new](https://pkg.pr.new): every push to the
distribution branch and every tag produces installable package URLs. Package names
stay `likec4` / `@likec4/*` but resolve to this fork's build.

Install by **branch**, **tag**, or **commit SHA** (use refs without slashes):

```sh
# latest from the distribution branch
pnpm add -D "https://pkg.pr.new/vbutto/likec4-explorer/likec4@explorer"
# or pin a tag / commit
pnpm add -D "https://pkg.pr.new/vbutto/likec4-explorer/likec4@<tag-or-sha>"
```

Then use the CLI exactly like upstream:

```sh
npx likec4 serve ./path/to/model     # dev server
npx likec4 build  ./path/to/model    # static site
```

> The CLI bundles the SPA at build time, so the navigation/Overview improvements
> are included in the `likec4` package itself.

## Building from source

```sh
corepack pnpm install
corepack pnpm run generate
corepack pnpm -C packages/likec4-spa dev ./path/to/model   # SPA dev against a model
```
