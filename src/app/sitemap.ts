import type { MetadataRoute } from "next";

import { localizePath, locales } from "@/lib/i18n/locales";
import { siteUrl } from "@/lib/site";

const absolute = (path: string): string => new URL(path, siteUrl).toString();

export default function sitemap(): MetadataRoute.Sitemap {
  const localized = ["/", "/fare", "/fare/suggest", "/contributors", "/feedback", "/sources", "/privacy", "/terms"].flatMap((path) => {
    const languages = Object.fromEntries(locales.map((locale) => [locale, absolute(localizePath(locale, path))]));
    return locales.map((locale) => ({
      url: absolute(localizePath(locale, path)),
      alternates: { languages },
    }));
  });
  // The TODA pages are not translated yet, so only their English URLs are listed.
  const englishOnly = ["/toda", "/toda/submit"].map((path) => ({ url: absolute(path) }));
  return [...localized, ...englishOnly];
}
