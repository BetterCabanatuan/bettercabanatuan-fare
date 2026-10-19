import { version } from "../../package.json";

export const siteName = "Pamasahe Cabanatuan";

// Shown in the footer; bump it with `npm version` so package.json stays the one source.
export const appVersion = version;

// The production subdomain is not decided yet, so the deployed URL comes from the environment.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// The city portal this app is a companion to; its pages are linked from the footer.
export const betterCabanatuanUrl = "https://bettercabanatuan.org";
