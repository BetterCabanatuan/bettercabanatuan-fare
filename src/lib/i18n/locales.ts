// Shared by server and client code. English lives at the unprefixed URLs (/fare);
// Tagalog lives under /tl (/tl/fare). See src/proxy.ts.

export const locales = ["en", "tl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const hasLocale = (value: string): value is Locale => locales.some((locale) => locale === value);

export const openGraphLocale: Record<Locale, string> = { en: "en_PH", tl: "tl_PH" };

/** The public URL of a path in a locale, e.g. ("tl", "/fare") → "/tl/fare". */
export const localizePath = (locale: Locale, path: string): string =>
  locale === defaultLocale ? path : `/${locale}${path === "/" ? "" : path}`;

/**
 * The locale-free path, e.g. "/tl/fare" → "/fare". English pages can also report their
 * internal "/en/..." path (the proxy rewrites to it), so every locale prefix is removed.
 */
export const stripLocale = (pathname: string): string => {
  const prefix = locales.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  return prefix ? pathname.slice(prefix.length + 1) || "/" : pathname;
};

/** Fills "{name}" placeholders in a dictionary string. */
export const fill = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
