import type { MetadataRoute } from "next";

import { localizePath, locales } from "@/lib/i18n/locales";
import { siteUrl } from "@/lib/site";

const absolute = (path: string): string => new URL(path, siteUrl).toString();

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/fare"].flatMap((path) => {
    const languages = Object.fromEntries(locales.map((locale) => [locale, absolute(localizePath(locale, path))]));
    return locales.map((locale) => ({
      url: absolute(localizePath(locale, path)),
      alternates: { languages },
    }));
  });
}
