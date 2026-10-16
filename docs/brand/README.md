# Pamasahe logo

A sibling of the [BetterCabanatuan](https://bettercabanatuan.org) logo: the Cabanatuan city silhouette with the Philippine sun rising behind it, where the sun is a peso coin. The sun follows the flag's construction: eight groups of three rays reaching 19/9 of the disc radius. Same palette as BetterCabanatuan: blue `#0032A0`, sun yellow `#F2C91D`.

![Logo, app tile and favicon](logo-sizes.png)

Top: the lockup, with "Fare" in the spot where BetterCabanatuan has ".org". Bottom: the mark, the app tile and the favicon.

| File | Use |
|---|---|
| `public/logo.svg` | Main mark (navbar via `src/components/shared/logo-mark.tsx`, documents). |
| `public/logo-lockup.svg` | Mark plus "Better Cabanatuan · Fare" wordmark. Its text uses Inter / Helvetica, so convert it to outlines before print. |
| `src/app/icon.svg` | Browser favicon: the peso sun alone, because the city outline turns to mush at 16 px. |
| `src/app/favicon.ico` | 16, 32 and 48 px of the favicon, for browsers that ignore SVG favicons. |
| `src/app/apple-icon.png` | 180 px iOS home-screen icon: the full-bleed app tile; iOS rounds the corners. |
| `public/icons/icon-192.png`, `icon-512.png` | Web app manifest icons: the app tile. |
| `public/icons/icon-maskable-512.png` | Android maskable icon: the peso sun inside the safe zone. |

The city silhouette is drawn from our own OpenStreetMap boundary (`data/geo/cabanatuan-boundary.json`), not copied from the BetterCabanatuan files.
