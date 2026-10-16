"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { locales, localizePath, stripLocale, type Locale } from "@/lib/i18n/locales";

const shortNames: Record<Locale, string> = { en: "EN", tl: "TL" };

export function LanguageToggle({
  locale,
  label,
  switchTo,
}: {
  locale: Locale;
  /** Names the group, e.g. "Language". */
  label: string;
  /** Accessible name of the other-language link, written in that language. */
  switchTo: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const path = stripLocale(pathname);

  // The fare page keeps the trip in the query (?a=…&b=…&mode=…). Reading it at click time
  // carries it over without useSearchParams, which would need a Suspense boundary.
  const handleClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    // Let the browser handle new-tab and new-window clicks.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    router.push(`${href}${window.location.search}`);
  };

  return (
    <div role="group" aria-label={label} className="flex rounded-full border bg-background">
      {locales.map((target) => {
        const href = localizePath(target, path);
        const isCurrent = target === locale;
        return (
          <Link
            key={target}
            href={href}
            hrefLang={target}
            lang={target}
            aria-current={isCurrent ? "true" : undefined}
            aria-label={isCurrent ? undefined : switchTo}
            onClick={(event) => handleClick(event, href)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-xs font-bold tracking-wider text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=true]:bg-foreground aria-[current=true]:text-background"
          >
            {shortNames[target]}
          </Link>
        );
      })}
    </div>
  );
}
