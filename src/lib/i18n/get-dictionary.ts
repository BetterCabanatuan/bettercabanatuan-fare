import { notFound } from "next/navigation";
import { lang } from "next/root-params";

import { en, type Dictionary } from "@/lib/i18n/dictionaries/en";
import { tl } from "@/lib/i18n/dictionaries/tl";
import { hasLocale, type Locale } from "@/lib/i18n/locales";

const dictionaries: Record<Locale, Dictionary> = { en, tl };

/** The current locale and its dictionary, for Server Components. */
export async function getDictionary(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return { locale, dict: dictionaries[locale] };
}
