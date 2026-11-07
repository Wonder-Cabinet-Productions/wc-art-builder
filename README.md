# Wonder Cabinet — Episode Art Builder

A browser-based tool for producers to compose **Wonder Cabinet** podcast episode art.

Three panels on a green-bordered canvas: a guest portrait on the right, two thematic images on the left. Drag-and-drop or Unsplash search to populate; drag within a panel to reposition; export the 3000×3000 composite + a `credits.md` file as downloads.

Original design by [Art + Sons](https://artandsons.com/).

## What this is

This is the public, producer-facing build of the Wonder Cabinet episode-art compositor. All image composition happens in the browser — there's no backend holding your work and no upload destination. The two files you export (composite JPG + credits.md) are downloads to your local machine.

The one server-side piece is a small Cloudflare Pages Function that proxies Unsplash search so the API key stays off the client. The hosted deployment also sits behind Cloudflare Access, so it does require a sign-in — see [Access control](#access-control).

Note that nothing persists: the source pool, the three panels, and Saved Combinations all live in memory, so reloading the page discards them. Export before you refresh.

## Relationship to `podcast-publishing-suite`

This repo is one of **two diverged copies** of the episode-art builder. The other lives at
[`tools/episode-art-builder/`](https://github.com/Wonder-Cabinet-Productions/podcast-publishing-suite/tree/master/tools/episode-art-builder)
in `podcast-publishing-suite`, as part of the agentic episode-publishing pipeline.

| | This repo (`wc-art-builder`) | Suite copy (`tools/episode-art-builder/`) |
|---|---|---|
| Audience | Producers, via the hosted site | The publishing pipeline, run locally |
| Backend | Cloudflare Pages Function (Unsplash proxy) | Local Python server (`serve.py`) |
| Extras | — | Saves straight to canonical episode folders; preloads source images from the episode's folder (`public/episode-preload/`) |
| Shared code | `public/index.html` | `public/index.html` — **forked, not synced** |

The two `index.html` files started from the same source. As of November 2026 the drift is small:
the compositor core is identical, and `functions/api/unsplash.js` matches byte for byte. The suite
copy adds about 140 lines on top: the save-to-episode-folder button and its `/save/*` calls, `/config`
detection, and `?episode=` preload. This repo has a newer header and intro text. Both of the
suite's additions switch themselves off when their server endpoints are missing. Nothing keeps
the two copies in sync, so a fix made in one does not reach the other.

**Planned refactor.** This repo was renamed from `episode-art-builder` to `wc-art-builder` ahead
of further feature work, and is intended to become the canonical home of the compositor. A future
refactor should make this repo the single source for the UI while keeping the pipeline features
**out of the hosted build**. Save-to-episode-folder won't work cleanly until other parts of the
pipeline are refactored, so it must not ship here yet, even hidden.

The plan is a pipeline-only add-on script:

- **This repo:** one `index.html` with no code for the episode folder. This is what deploys.
- **The suite:** a separate `pipeline.js` with the save-to-folder button (the script adds the
  button itself), the `/config` check, and the `?episode=` preload. `serve.py` serves this repo's
  `index.html` and adds a `<script src="pipeline.js">` tag as it sends the page.

`pipeline.js` can call the page's global functions (`handleFiles`, `drawCover`,
`generateCreditsMarkdown`, `slotData`), so this is mostly moving code, not rewriting it. Rename or
re-scope any of those and the add-on breaks, so treat them as a public interface. Whether any
pipeline feature reaches the hosted site is a separate decision for after the pipeline refactor.

Until then, port any compositor change you want in both places by hand.

## Running locally

Which local server you want depends on whether you need the Unsplash search tab.

**Upload, compose, and export only** — any static server will do:

```bash
cd public/
python3 -m http.server 8765
# → http://localhost:8765
```

Unsplash search will fail here. It calls `/api/unsplash`, which a plain static server doesn't
serve, so the tab reports a 404. Everything else works.

**Including Unsplash search** — you need the Pages Function, so run Wrangler from the repo root:

```bash
echo 'UNSPLASH_KEY=your-unsplash-access-key' > .dev.vars   # gitignored; create once
npx wrangler pages dev public
```

`.dev.vars` is how Wrangler supplies `UNSPLASH_KEY` locally. Without it the Function returns
`500 {"error":"UNSPLASH_KEY not configured"}`.

## Deploying

Live at **https://art.wondercabinetproductions.com** — Cloudflare Pages project
`episode-art-builder`. (The Pages project kept its original name when the GitHub repo was renamed
to `wc-art-builder`; the commands below use the Pages name.)

**Deploys are manual. Pushing to `master` does not deploy anything.** The Pages project is
configured for *direct upload*, with no Git integration, so the repo and production drift apart
silently. After committing, publish explicitly:

```bash
npx wrangler pages deploy public --project-name=episode-art-builder
```

Wrangler uploads `public/` as the static site and `functions/` as Pages Functions. Files at the
repo root (this README, `.impeccable.md`) are not part of the deployed output.

### Access control

The site sits behind **Cloudflare Access**, covering both `art.wondercabinetproductions.com` and
`episode-art-builder.pages.dev` — including the `/api/*` routes, which keeps the Unsplash proxy
from being an open relay for the API key.

The policy is scoped to **`@wondercabinetproductions.com`** identities. Signing in with any other
address (a personal Gmail, a client's own domain) is refused at the login screen.

> **This failure looks like an outage but isn't.** A refused identity produces a login you can
> never get past, with the site itself perfectly healthy behind it. Before debugging the app,
> confirm which email you're presenting to Access. Onboarding an outside collaborator means adding
> them to the Access policy in the Zero Trust dashboard — not changing anything in this repo.

### Unsplash API

Browser code never touches `api.unsplash.com` directly. Requests go to `/api/unsplash`, handled by
`functions/api/unsplash.js`, which attaches the access key server-side so it's never shipped in
client JS. The key lives in the Pages project as the `UNSPLASH_KEY` secret:

```bash
npx wrangler pages secret put UNSPLASH_KEY --project-name=episode-art-builder
```

Attribution is contractual, not optional: the `utm_source`/`utm_medium` parameters on photographer
links and the `action=track-download` ping are both Unsplash API Guidelines requirements. Removing
them puts API access at risk.

## Layout spec

| Element | Size |
|---|---|
| Canvas | 3000×3000 |
| Outer green border | 25px, `#10a544` |
| Black padding around each image | 30px, `#000000` |
| Green gutter between panels | 26px |
| Image area (each panel) | 1402px wide |
| Right panel height | 2890px (full canvas height minus borders) |
| Left panel height | 1402px (square) |

## License

This tool is published as part of the Wonder Cabinet production toolkit. The original collage design is by Art + Sons.
