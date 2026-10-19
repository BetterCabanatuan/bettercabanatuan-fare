import Link from "next/link";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";

/** Site-wide notice while fares and routes are still being checked against official sources. */
export async function AlphaBanner() {
  const { locale, dict } = await getDictionary();

  return (
    <div role="note" aria-label={dict.banner.label} className="border-b border-warning-border bg-warning text-warning-foreground">
      <p className="mx-auto max-w-5xl px-4 py-1.5 text-xs leading-snug sm:py-2 sm:text-sm">
        <span className="mr-1.5 rounded bg-warning-foreground px-1.5 py-0.5 text-[10px] font-bold sm:text-xs uppercase tracking-wider text-warning">
          {dict.banner.tag}
        </span>
        {dict.banner.text}{" "}
        {/* Riders who doubt a number are the ones who can correct it, so the notice asks them to. */}
        <Link
          href={localizePath(locale, "/feedback")}
          className="font-bold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning-foreground"
        >
          {dict.banner.report}
        </Link>
      </p>
    </div>
  );
}
