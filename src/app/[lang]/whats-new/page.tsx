import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { releases } from "@/lib/data";
import { formatDate } from "@/lib/format-date";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fill, localizePath } from "@/lib/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getDictionary();
  return {
    title: dict.whatsNew.title,
    description: dict.whatsNew.description,
    alternates: {
      canonical: localizePath(locale, "/whats-new"),
      languages: { en: "/whats-new", tl: "/tl/whats-new", "x-default": "/whats-new" },
    },
  };
}

export default async function WhatsNewPage() {
  const { locale, dict } = await getDictionary();
  const t = dict.whatsNew;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
        <p className="text-pretty text-muted-foreground">{t.intro}</p>
      </header>

      <ol className="flex flex-col gap-4">
        {releases.map((release, index) => (
          <li key={release.version}>
            <article
              aria-labelledby={`release-${release.version}`}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-4 text-card-foreground sm:p-6"
            >
              <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 id={`release-${release.version}`} className="text-lg font-bold tabular-nums">
                  {fill(t.version, { version: release.version })}
                </h2>
                {index === 0 && <Badge>{t.latest}</Badge>}
                <p className="text-sm text-muted-foreground">
                  <time dateTime={release.date}>{fill(t.released, { date: formatDate(release.date) })}</time>
                </p>
              </header>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-pretty">
                {release.changes.map((change) => (
                  <li key={change.en}>{change[locale]}</li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ol>
    </main>
  );
}
