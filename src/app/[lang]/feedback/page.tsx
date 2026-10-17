import type { Metadata } from "next";
import { Suspense } from "react";

import { FeedbackForm } from "@/components/feedback/feedback-form";
import { SignInOptions } from "@/components/feedback/sign-in-options";
import { SignedInBar } from "@/components/shared/signed-in-bar";
import { sitePath } from "@/lib/feedback/submission";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";
import { getRider } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getDictionary();
  return {
    title: dict.feedback.title,
    description: dict.feedback.description,
    alternates: {
      canonical: localizePath(locale, "/feedback"),
      languages: { en: "/feedback", tl: "/tl/feedback", "x-default": "/feedback" },
    },
  };
}

export default async function FeedbackPage({ searchParams }: PageProps<"/[lang]/feedback">) {
  const { dict } = await getDictionary();
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">{dict.feedback.title}</h1>
        <p className="text-pretty text-muted-foreground">{dict.feedback.intro}</p>
      </header>
      {/* Who is signed in comes from the session cookie, so this part renders per request. */}
      <Suspense fallback={<div aria-busy="true" className="min-h-64 rounded-2xl border bg-card" />}>
        <SignedInOrNot searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SignedInOrNot({ searchParams }: Pick<PageProps<"/[lang]/feedback">, "searchParams">) {
  const [{ dict }, params, rider] = await Promise.all([getDictionary(), searchParams, getRider()]);
  const from = sitePath(typeof params.from === "string" ? params.from : undefined);

  if (!rider) return <SignInOptions from={from} signInFailed={params.error === "signin"} />;

  return (
    <section aria-label={dict.feedback.title} className="rounded-2xl border bg-card">
      <SignedInBar rider={rider} from={from} className="border-b" />
      <FeedbackForm from={from} />
    </section>
  );
}
