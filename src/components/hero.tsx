import Link from "next/link";

import { FareBoard } from "@/components/home/fare-board";
import { jeepRules } from "@/lib/data";
import { formatDate } from "@/lib/format-date";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fill, localizePath } from "@/lib/i18n/locales";

export async function Hero() {
  const { locale, dict } = await getDictionary();
  const farePath = localizePath(locale, "/fare");

  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:py-20">
        <div className="flex min-w-0 flex-col items-start gap-5">
          <p className="rounded bg-highlight px-2 py-1 text-xs font-bold tracking-wider text-highlight-foreground uppercase">
            {fill(dict.home.tag, { date: formatDate(jeepRules.effectiveDate) })}
          </p>
          {/* The headline is Tagalog in both languages; lang lets screen readers pronounce it on English pages. */}
          <h1 lang="tl" className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Magkano ang pamasahe?
          </h1>
          <p className="max-w-xl text-lg text-pretty text-primary-foreground/85">{dict.home.intro}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={farePath}
              className="inline-flex min-h-11 items-center rounded-lg bg-highlight px-5 font-bold text-highlight-foreground transition-colors hover:bg-highlight/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
            >
              {dict.home.computeTricycle}
            </Link>
            <Link
              href={`${farePath}?mode=jeep`}
              className="inline-flex min-h-11 items-center rounded-lg border-2 border-primary-foreground px-5 font-bold transition-colors hover:bg-primary-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
            >
              {dict.home.computeJeep}
            </Link>
          </div>
        </div>
        <FareBoard />
      </div>
    </section>
  );
}
