# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A producer-facing browser tool that composes 3-panel Wonder Cabinet episode art and exports a
3000×3000 JPG plus a `credits.md`. Deliberately dependency-free: **no package.json, no build step,
no framework, no tests.** The whole app is `public/index.html` (~1,275 lines: inline `<style>`,
markup, then one `<script>` of plain globals). The only server-side code is
`functions/api/unsplash.js`, a Cloudflare Pages Function.

Do not introduce a bundler, framework, or package manager without asking. The zero-build property
is a design decision, not an oversight.

## Deploying — `git push` does NOT deploy

The Cloudflare Pages project `episode-art-builder` is **direct-upload with no Git integration**.
Commits never reach production on their own. After committing, publish explicitly:

```bash
npx wrangler pages deploy public --project-name=episode-art-builder
```

Only `public/` and `functions/` are deployed; root files (`README.md`, `.impeccable.md`) are not.
Assume repo HEAD and production have drifted until you've checked
`wrangler pages deployment list --project-name=episode-art-builder`.

## Local development

`python3 -m http.server` inside `public/` is fine for upload/compose/export, but Unsplash search
will 404 — that path needs the Pages Function. For search, from the repo root:

```bash
npx wrangler pages dev public    # requires .dev.vars containing UNSPLASH_KEY=...
```

## Access control — a refused login looks exactly like an outage

The deployed site is behind Cloudflare Access, scoped to **`@wondercabinetproductions.com`**
identities, covering `/api/*` as well as the static site. Signing in with any other address is
refused at the login screen with the app perfectly healthy behind it.

If someone reports the site is down, **verify which email they're presenting to Access before
investigating the app.** Adding an outside collaborator is a Zero Trust policy change, not a repo
change.

## Gotchas that will bite you

- **CORS taint breaks export.** Every image load path must set `img.crossOrigin = 'anonymous'`
  before `src` (see `public/index.html:463`, `:469`). Omit it and `toBlob` silently returns null,
  surfacing only as the vague "Export failed (CORS issue…)" message.
- **Filename-regex order is load-bearing.** `parseCompositeFilename()` must run *before*
  `parseUnsplashFilename()` — the single-photo regex is greedy and will swallow composite
  filenames, mis-crediting them silently. There's a comment marking this at `:506`.
- **Inline `onclick` handlers everywhere.** Functions are globals bound via HTML attributes.
  Converting the script to `type="module"` breaks every handler at once.
- **No persistence.** Source pool, panels, and Saved Combinations are in-memory only; a reload
  discards them. Don't assume state survives navigation.
- **Layout constants are duplicated.** The spec table in `README.md` mirrors the constants at
  `public/index.html:302-309`. Change both together.
- **`exifr` loads from a CDN**, unpinned and without SRI. Credit auto-detection degrades silently
  offline (guarded by a `typeof exifr === 'undefined'` check).

## Unsplash attribution is contractual

The `utm_source`/`utm_medium` parameters on photographer links and the `action=track-download`
ping are Unsplash API Guidelines requirements, not etiquette. Removing them risks API access.

## Design changes

Read `.impeccable.md` before any visual work. It is the canonical design context for Wonder Cabinet
producer tools and this repo is its reference implementation: dark UI (never pure black), `#10a544`
used sparingly, left-aligned editorial layout, and an explicit anti-reference list (no SaaS-dashboard
patterns, no glassmorphism, no card-everything, no border-left accent stripes).

## Repo conventions

Default branch is **`master`**, not `main`. Issues live on the `Wonder-Cabinet-Productions` GitHub
org. A fuller, integrated version of this tool lives in `podcast-publishing-suite`; this is the
public build and deliberately omits its pipeline integrations.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (`Wonder-Cabinet-Productions/wc-art-builder`), managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root, created as terms and decisions get settled. See `docs/agents/domain.md`.
