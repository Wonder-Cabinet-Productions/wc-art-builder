# Unsplash API compliance test

This test produces the evidence Unsplash asks for in a production-approval review. It shows that
attribution links carry UTM params and point at the photographer's profile, and that choosing a photo
triggers the download endpoint. The test is agent-driven, using Claude in Chrome in a browser signed in
through Cloudflare Access, because production is gated and the repo deliberately has no test tooling.
To run it, ask: "run the Unsplash compliance test".

Guidelines it checks against:
- Attribution: https://help.unsplash.com/en/articles/2511315-guideline-attribution
- Triggering a download: https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download

## Steps

Run every step against production (`https://art.wondercabinetproductions.com`) in a new tab, after
`wrangler pages deployment list` confirms that production matches the commit you are testing. Save each
artifact to `~/Desktop/unsplash-compliance-YYYY-MM-DD/`, which is outside the repo.

1. **Search.** Search for `cabinet of curiosities`.
2. **Attribution assertion.** Run this in the page with `javascript_tool`, then click one result into
   the pool and drop it into a panel so the pool card and the credits pane render. Run the check again:

   ```js
   [...document.querySelectorAll('a[href*="unsplash.com"]')].map(a => {
     const u = new URL(a.href);
     return {
       text: a.textContent.trim(),
       href: a.href,
       utm: u.searchParams.get('utm_source') === 'wonder_cabinet_art_builder' &&
            u.searchParams.get('utm_medium') === 'referral',
       kind: u.pathname.startsWith('/@') ? 'photographer' : u.pathname === '/' ? 'unsplash' : 'other',
     };
   });
   ```

   **Pass:** every row has `utm: true`, and each "Photo by X" name link has `kind: 'photographer'`.
   Take a screenshot of the result: `01-attribution-assertion.png`.
3. **Hover and click evidence.** Record `02-attribution.gif` with `gif_creator`. Hover a photographer
   name until the URL appears in the bottom-left corner, then click it and show the new tab's address
   bar. Do the same for the "Unsplash" link. Capture extra frames before and after each action.
4. **Download trigger.** Clear network history and click a search result into the pool. With
   `read_network_requests`, find the `/api/unsplash?action=track-download` request.
   **Pass:** exactly one request, status 200, body `{"tracked":true,...}`. Record
   `03-download-trigger.gif` of the click and the request.
5. **Negative check.** In the page, run
   `fetch('/api/unsplash?action=track-download&url=' + encodeURIComponent('https://example.com/x')).then(r => r.status)`.
   **Pass:** `400`. This shows the API key is only ever sent to Unsplash.
6. **Downloads counter (human step).** The operator signs in at https://unsplash.com/oauth/applications,
   opens the app, and takes a screenshot showing Downloads > 0: `04-downloads-counter.png`.

## When it fails

- `track-download` returns **502 with `status: 401`**: Unsplash rejected the key. Check `UNSPLASH_KEY`
  in the Pages project's environment.
- **400** on a real `download_location`: the response shape changed. Compare it with the path check
  in `functions/api/unsplash.js`.
- A link without UTM: find where it is built (`grep -n "unsplash.com" public/index.html`) and route
  it through `UTM` or `withUtm()`.
