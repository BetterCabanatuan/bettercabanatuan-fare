import { UserRound } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { signOutRider } from "@/app/[lang]/feedback/actions";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { SignInOptions } from "@/components/feedback/sign-in-options";
import { Button } from "@/components/ui/button";
import { sitePath } from "@/lib/feedback/submission";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fill, localizePath } from "@/lib/i18n/locales";
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
  const [{ locale, dict }, params, rider] = await Promise.all([getDictionary(), searchParams, getRider()]);
  const from = sitePath(typeof params.from === "string" ? params.from : undefined);

  if (!rider) return <SignInOptions from={from} signInFailed={params.error === "signin"} />;

  return (
    <section aria-label={dict.feedback.title} className="rounded-2xl border bg-card">
      <div className="flex items-center gap-3 border-b px-4 py-2 sm:px-6">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <UserRound aria-hidden className="size-4 text-muted-foreground" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col text-sm">
          <p className="font-semibold break-words">
            {fill(dict.feedback.signedInAs, { name: rider.name ?? rider.email ?? "" })}
          </p>
          {rider.name && rider.email && <p className="truncate text-muted-foreground">{rider.email}</p>}
        </div>
        <form action={signOutRider}>
          <input type="hidden" name="locale" value={locale} />
          {from && <input type="hidden" name="from" value={from} />}
          <Button type="submit" variant="ghost" className="h-11">
            {dict.feedback.signOut}
          </Button>
        </form>
      </div>
      <FeedbackForm from={from} />
    </section>
  );
}
