// Maintenance mode: while the MAINTENANCE_MODE Worker variable is "true", src/proxy.ts
// serves the maintenance page with a 503 for every page except the admin area.
// Pure functions, so the proxy, the page and the tests share one reading of the flags.
// Turning it on and off: docs/deploy/cloudflare.md#maintenance-mode

import type { Locale } from "@/lib/i18n/locales";

/** Seconds a client should wait before retrying when no end time is set. */
export const defaultRetryAfterSeconds = 3600;

/** True only for "true" (any case, surrounding spaces ignored), so a typo leaves the site up. */
export const isMaintenanceOn = (value: string | undefined): boolean => value?.trim().toLowerCase() === "true";

/**
 * Paths that keep working during maintenance: the admin area in both languages, including
 * sign-in. /api/auth/* callbacks never reach the proxy (its matcher skips /api/), and
 * neither do static files, /robots.txt or /sitemap.xml.
 */
export const isOpenDuringMaintenance = (pathname: string): boolean => /^(\/tl)?\/admin(\/|$)/.test(pathname);

/**
 * The MAINTENANCE_UNTIL time, e.g. "2026-10-18T18:00+08:00", or null when it is unset,
 * invalid or already past. A time without an offset is read as Manila time, because the
 * Worker runs in UTC and the person setting it is in Cabanatuan.
 */
export function parseMaintenanceUntil(value: string | undefined, now: Date): Date | null {
  const text = value?.trim();
  if (!text) return null;
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/i.test(text);
  const until = new Date(hasOffset ? text : `${text}+08:00`);
  if (Number.isNaN(until.getTime()) || until <= now) return null;
  return until;
}

/** The Retry-After header: the end time as an HTTP date when known, otherwise a delay in seconds. */
export const retryAfter = (until: Date | null): string => (until ? until.toUTCString() : String(defaultRetryAfterSeconds));

const untilFormats: Record<Locale, Intl.DateTimeFormat> = {
  // Day-first like the rest of the site (see format-date.ts), with a 12-hour clock.
  en: new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Manila",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }),
  tl: new Intl.DateTimeFormat("fil-PH", {
    timeZone: "Asia/Manila",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }),
};

/** The end time in Manila, e.g. "Sunday 18 October at 6:00 pm". */
export const formatMaintenanceUntil = (until: Date, locale: Locale): string => untilFormats[locale].format(until);
