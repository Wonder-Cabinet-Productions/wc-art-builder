---
name: deploy
description: Publish the Episode Art Builder to Cloudflare Pages and verify the deploy landed. Use when asked to deploy, ship, publish, or push this site live.
disable-model-invocation: true
---

# Deploy the Episode Art Builder

Deploys here are **manual**. Read the "Deploying" and "Access control" sections of `CLAUDE.md`
first: they hold the project name, what gets published, and the Access policy. This skill is the
checklist around that command. It doesn't repeat those facts, so the two can't drift apart.

Production once ran two months behind `master` and nothing flagged it. That's why this checklist
exists.

> If issue #7 lands and Git integration is wired up, this skill becomes obsolete, because pushes
> will deploy automatically. Check whether `npx wrangler pages project list` still reports
> `Git Provider: No` before assuming a manual deploy is needed.

## Before deploying

Deploying publishes to a live, client-facing site. Do not run this because a change was merged.
Run it because the user asked for a deploy.

1. **Confirm you're on `master`, in sync with `origin`.** Only deploy from `master`:

   ```bash
   git fetch origin
   git branch --show-current
   git rev-list --left-right --count origin/master...HEAD
   ```

   This prints two numbers, and both must be `0`. A non-zero **left** number means `master` has
   moved and you would publish a stale tree, so pull first. A non-zero **right** number means local
   commits that were never pushed, so production would run code no one else can see or roll back
   to. Push them, through a PR if they need review, before deploying.

2. **Require a clean tree, including ignored files.** Wrangler uploads the contents of `public/`
   and `functions/` as they sit on disk, not a commit. That includes files git ignores.
   `public/episode-preload/` is gitignored and is where episode images go when the pipeline copy
   is used. A plain `git status` would never show them.

   ```bash
   git status --porcelain --ignored public/ functions/
   ```

   This must print nothing. If it prints anything, **stop**. Show the user what's there and have
   them commit it, stash it, or remove it before deploying. Don't deploy a dirty tree "with
   confirmation". The deploy records HEAD's commit hash, so production would then contain code
   that hash doesn't describe.

3. **Show the user what they're publishing and get a go-ahead:**

   ```bash
   git log -1 --format='%h %s'
   ```

   If the commits since the last deploy only touch root files (`README.md`, `CLAUDE.md`,
   `.impeccable.md`, `docs/`), the deploy changes nothing user-visible. Say so, rather than implying
   a functional change.

## Deploy

```bash
npx wrangler pages deploy public --project-name=episode-art-builder --branch=master
```

`--branch` decides whether the deploy goes to production. Without it, wrangler uses the current git
branch's name, and anything except the project's production branch becomes a **Preview** deploy,
leaving production unchanged. Always pass it explicitly.

## Verify

Never report success from the deploy command's output alone.

```bash
npx wrangler pages deployment list --project-name=episode-art-builder | head -8
```

- The top row must show the `Production` environment, with the commit from step 3 in the
  `Source` column. Step 2 guaranteed a clean tree, so that hash matches what was uploaded.
- If the top row is `Preview`, the project's production branch is not `master`. **Stop and tell
  the user.** Production is unchanged. Don't retry with other branch names. The production branch
  setting is in the Cloudflare dashboard, and this skill needs updating to match it.

The CLI can't confirm the app itself works. Cloudflare Access redirects every unauthenticated
request at the edge, before it reaches Pages, so `curl` gets a `302` whether the deploy is healthy
or broken. Ask the user to load https://art.wondercabinetproductions.com in a browser while signed
in with an `@wondercabinetproductions.com` address, and to run one Unsplash search. Until they
have, report the deploy as **registered**, not verified working.

## If Unsplash search breaks after a deploy

The `UNSPLASH_KEY` secret belongs to the project, not the upload. Check that it's still there:

```bash
npx wrangler pages secret list --project-name=episode-art-builder
```

If it's missing, the Function returns `500 {"error":"UNSPLASH_KEY not configured"}`. Restore it by
piping the key in. Never paste it into the session or type it at a prompt:

```bash
get-secret.sh UNSPLASH_KEY | npx wrangler pages secret put UNSPLASH_KEY --project-name=episode-art-builder
```

If `get-secret.sh` isn't on PATH or can't resolve the key, stop and flag it to the user.

## If a user reports the site is down

Ask which email they're signing in with **before** investigating the deploy. See "Access control"
in `CLAUDE.md`. A refused identity looks exactly like an outage.
