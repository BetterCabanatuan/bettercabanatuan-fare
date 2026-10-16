# Pamasahe logo

A peso sign in a map pin: "the fare for this place". Jeepney yellow pin, civic blue tile, near-black peso.

![Logo at app-icon and favicon sizes](logo-sizes.png)

Rows: the main mark, the favicon cut, and the full-bleed app icon. Each row shows 180 px, then the real 16 and 32 px favicons on light and dark browser tabs, with the 16 px one enlarged.

| File | Use |
|---|---|
| `public/logo.svg` | Main mark (navbar, social, documents). Same drawing as `src/components/shared/logo-mark.tsx`. |
| `src/app/icon.svg` | Browser favicon. A heavier one-bar cut, because two bars blur together at 16 px. |
| `src/app/favicon.ico` | 16, 32 and 48 px of the favicon cut, for browsers that ignore SVG favicons. |
| `src/app/apple-icon.png` | 180 px iOS home-screen icon. Full-bleed; iOS rounds the corners. |
| `public/icons/icon-192.png`, `icon-512.png` | Web app manifest icons. |
| `public/icons/icon-maskable-512.png` | Android maskable icon; the pin sits inside the safe zone. |

Colours: blue `#1B3F8B` (`--primary`), yellow `#F5C518` (`--highlight`), ink `#15181C`.

To change the mark, edit `public/logo.svg` and `logo-mark.tsx` together, then re-export the PNG and ICO files at the sizes above.
