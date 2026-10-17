import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PublicNameForm } from "@/components/routes/public-name-form";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fill, localizePath, type Locale } from "@/lib/i18n/locales";
import type { Board, BoardEntry } from "@/lib/routes/contributors";
import { getContributorBoard, getPublicName } from "@/lib/routes/queries";
import { getRider } from "@/lib/session";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getDictionary();
  return {
    title: dict.contributors.title,
    description: dict.contributors.description,
    alternates: {
      canonical: localizePath(locale, "/contributors"),
      languages: { en: "/contributors", tl: "/tl/contributors", "x-default": "/contributors" },
    },
  };
}

export default async function ContributorsPage() {
  const { locale, dict } = await getDictionary();
  const t = dict.contributors;
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col items-start gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
        <p className="text-pretty text-muted-foreground">{t.intro}</p>
        <Button render={<Link href={localizePath(locale, "/fare/suggest")} />} nativeButton={false} size="lg" className="h-11">
          {t.suggest}
        </Button>
      </header>
      {/* The board changes with every approval and the name form depends on who is signed
          in, so this part renders per request. */}
      <Suspense fallback={<div aria-busy="true" className="min-h-64 rounded-2xl border bg-card" />}>
        <BoardAndName />
      </Suspense>
    </main>
  );
}

async function BoardAndName() {
  const [{ locale, dict }, rider] = await Promise.all([getDictionary(), getRider()]);
  const t = dict.contributors;
  const [board, publicName] = await Promise.all([
    getContributorBoard(rider?.id ?? null),
    // A failed read shows the form empty; saving still works.
    rider ? getPublicName(rider.id).catch(() => null) : null,
  ]);

  return (
    <>
      {board ? (
        <BoardTable board={board} locale={locale} dictionary={t} />
      ) : (
        <p className="rounded-xl border border-dashed p-6 text-muted-foreground">{t.unavailable}</p>
      )}

      <section aria-labelledby="public-name-heading" className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:p-6">
        <h2 id="public-name-heading" className="text-lg font-bold">
          {t.nameHeading}
        </h2>
        {rider ? (
          <PublicNameForm current={publicName} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t.signInToBeCounted}{" "}
            <Link
              href={localizePath(locale, "/fare/suggest")}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t.suggest}
            </Link>
          </p>
        )}
      </section>
    </>
  );
}

type BoardTableProps = { board: Board; locale: Locale; dictionary: Dictionary["contributors"] };

function BoardTable({ board, locale, dictionary: t }: BoardTableProps) {
  if (board.top.length === 0) {
    return <p className="rounded-xl border border-dashed p-6 text-muted-foreground">{t.empty}</p>;
  }
  // Month of the latest approval, in Manila time and the reader's language: "Oct 2026".
  const month = new Intl.DateTimeFormat(locale === "tl" ? "fil-PH" : "en-PH", {
    month: "short",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
  const youInTop = board.top.some((entry) => entry.isYou);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <caption className="sr-only">{t.caption}</caption>
          <thead className="bg-muted text-left text-muted-foreground">
            <tr>
              <th scope="col" className="w-14 px-3 py-2 font-semibold">
                {t.rank}
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                {t.name}
              </th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">
                {t.approved}
              </th>
              <th scope="col" className="hidden px-3 py-2 text-right font-semibold min-[400px]:table-cell">
                {t.latest}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {board.top.map((entry) => (
              <BoardRow key={entry.key} entry={entry} month={month} dictionary={t} />
            ))}
          </tbody>
        </table>
      </div>
      {!youInTop && (
        <p className="text-sm text-muted-foreground">
          {board.you ? fill(t.yourRank, { rank: board.you.rank, count: board.you.approved }) : t.noneYet}
        </p>
      )}
    </div>
  );
}

type BoardRowProps = { entry: BoardEntry; month: Intl.DateTimeFormat; dictionary: Dictionary["contributors"] };

function BoardRow({ entry, month, dictionary: t }: BoardRowProps) {
  return (
    <tr className={cn(entry.isYou && "bg-primary/10 font-semibold")}>
      <td className="px-3 py-2.5 tabular-nums">{entry.rank}</td>
      <td className="px-3 py-2.5 break-words">
        {entry.name ?? <span className="text-muted-foreground">{t.anonymous}</span>}
        {entry.isYou && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{t.you}</span>}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">{entry.approved}</td>
      <td className="hidden px-3 py-2.5 text-right whitespace-nowrap text-muted-foreground min-[400px]:table-cell">
        {month.format(entry.latest)}
      </td>
    </tr>
  );
}
