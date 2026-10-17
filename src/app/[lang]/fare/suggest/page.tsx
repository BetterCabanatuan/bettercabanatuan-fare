import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInOptions } from "@/components/feedback/sign-in-options";
import { RouteSubmissionForm } from "@/components/routes/route-submission-form";
import { SignedInBar } from "@/components/shared/signed-in-bar";
import { cityBoundary } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";
import { getRider } from "@/lib/session";

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

export default async function SuggestRoutePage({ searchParams }: PageProps<"/[lang]/fare/suggest">) {
  const { dict } = await getDictionary();
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">{dict.suggest.title}</h1>
        <p className="text-pretty text-muted-foreground">
          {dict.suggest.intro} {dict.suggest.required}
        </p>
      </header>
      {/* Who is signed in comes from the session cookie, so this part renders per request. */}
      <Suspense fallback={<div aria-busy="true" className="min-h-64 rounded-2xl border bg-card" />}>
        <SignedInOrNot searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SignedInOrNot({ searchParams }: Pick<PageProps<"/[lang]/fare/suggest">, "searchParams">) {
  const [{ locale, dict }, params, rider] = await Promise.all([getDictionary(), searchParams, getRider()]);
  const here = localizePath(locale, "/fare/suggest");

  if (!rider) {
    return (
      <SignInOptions
        returnTo={here}
        heading={dict.suggest.signInHeading}
        reason={dict.suggest.signInWhy}
        signInFailed={params.error === "signin"}
      />
    );
  }

  return (
    <>
      <SignedInBar rider={rider} returnTo={here} className="rounded-2xl border bg-card" />
      <RouteSubmissionForm boundary={cityBoundary} />
    </>
  );
}
