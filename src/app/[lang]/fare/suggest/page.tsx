import type { Metadata } from "next";

import { RouteSubmissionForm } from "@/components/routes/route-submission-form";
import { cityBoundary } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getDictionary();
  return {
    title: dict.suggest.title,
    description: dict.suggest.description,
    alternates: {
      canonical: localizePath(locale, "/fare/suggest"),
      languages: { en: "/fare/suggest", tl: "/tl/fare/suggest", "x-default": "/fare/suggest" },
    },
  };
}

export default async function SuggestRoutePage() {
  const { dict } = await getDictionary();
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">{dict.suggest.title}</h1>
        <p className="text-pretty text-muted-foreground">
          {dict.suggest.intro} {dict.suggest.required}
        </p>
      </header>
      <RouteSubmissionForm boundary={cityBoundary} />
    </main>
  );
}
