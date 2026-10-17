import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { TodaDirectory } from "@/components/toda/toda-directory";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";
import { listVerifiedTodas } from "@/lib/toda/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getDictionary();
  return {
    title: dict.meta.todaTitle,
    description: dict.meta.todaDescription,
    alternates: {
      canonical: localizePath(locale, "/toda"),
      languages: { en: "/toda", tl: "/tl/toda", "x-default": "/toda" },
    },
  };
}

export default async function TodaPage() {
  const { locale, dict } = await getDictionary();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight">{dict.toda.heading}</h1>
          <p className="text-pretty text-muted-foreground">{dict.toda.intro}</p>
        </div>
        <Link
          href={localizePath(locale, "/toda/submit")}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg bg-highlight px-5 font-bold text-highlight-foreground transition-colors hover:bg-highlight/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:self-auto"
        >
          <Plus aria-hidden="true" className="size-4" />
          {dict.toda.addToda}
        </Link>
      </header>

      {/* Read per request, not at build time, so the image builds without a database. */}
      <Suspense fallback={<p className="text-muted-foreground">{dict.toda.loading}</p>}>
        <TodaList />
      </Suspense>
    </main>
  );
}

async function TodaList() {
  await connection();
  const [{ locale, dict }, todas] = await Promise.all([getDictionary(), listVerifiedTodas()]);

  return todas.length === 0 ? (
    <section className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
      <h2 className="text-lg font-bold">{dict.toda.emptyTitle}</h2>
      <p className="max-w-xl text-muted-foreground">{dict.toda.emptyBody}</p>
      <Link
        href={localizePath(locale, "/toda/submit")}
        className="font-semibold text-primary underline-offset-4 hover:underline"
      >
        {dict.toda.addFirst}
      </Link>
    </section>
  ) : (
    <TodaDirectory todas={todas} />
  );
}
