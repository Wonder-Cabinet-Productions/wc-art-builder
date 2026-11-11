# Brand assets

Logo PNGs drawn into the exported art (Social Sharing Graphic, 16:9 YouTube thumbnail, quote cards).
They are vendored here so the hosted build stays zero-build and every image loads same-origin, which
keeps the export canvas untainted.

| File | What it is | Used on |
|---|---|---|
| `cabinet-black.png` | Black cabinet, no wordmark | Social plate lockup, 16:9 |
| `cabinet-green.png` | Green cabinet, no wordmark | (kept for a green-cabinet lockup) |
| `wordmark-title-white.png` | "WONDER / CABINET" wordmark, white (tinted cream on the social plate) | Social plate lockup, 16:9 |
| `logo-h-dark.png` | Horizontal logo for dark grounds: green cabinet, white wordmark | Quote cards on Night and Deep green |
| `logo-h-light.png` | Horizontal logo for light grounds: black cabinet, green wordmark | Quote cards on Cream |
| `logo-h-on-green.png` | Horizontal logo on green: black cabinet, white wordmark | Quote cards on Cabinet green |

## Source

The canonical brand kit is in the `wc-branding` repo, at
`brand-kits/wonder-cabinet/site images/1-LogoAssets/`. The horizontal logos were rendered from the kit's
`Primary-Logo-Cabinet-Galaxy-Wordmark` SVGs at 2400px wide.

`logo-h-on-green.png` is a composite of the black cabinet and the white wordmark. The pairing itself is
on-brand (brand book p.1 and p.3, "Logo on Green" and "Horizontal Logo on Green"), but the kit has no
horizontal-on-green file yet. Replace this one with the official lockup from Art + Sons when it exists.

If a file here changes, re-sync it from `wc-branding` rather than editing it in place.
