import type { Metadata } from "next";
import { Suspense } from "react";

import { SubmissionForm } from "@/components/toda/submission-form";
import { cityBoundary } from "@/lib/data";
import { getToda } from "@/lib/toda/queries";

export const metadata: Metadata = {
  title: "Add a TODA",
  description: "Tell us about a TODA in Cabanatuan City and where its terminal is.",
  alternates: { canonical: "/toda/submit" },
};

export default function SubmitTodaPage({ searchParams }: PageProps<"/[lang]/toda/submit">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Add a TODA</h1>
        <p className="text-pretty text-muted-foreground">
          Help commuters find the right tricycle. Tell us the TODA&apos;s name and where its terminal is.
          Fields marked <span className="text-destructive">*</span> are required.
        </p>
      </header>
      {/* ?toda=<id> comes from "Suggest another position" in the directory. */}
      <Suspense fallback={<div aria-busy="true" className="min-h-64 rounded-xl border bg-card" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Form({ searchParams }: Pick<PageProps<"/[lang]/toda/submit">, "searchParams">) {
  const { toda: id } = await searchParams;
  const toda = typeof id === "string" ? await findToda(id) : null;
  return <SubmissionForm boundary={cityBoundary} todaName={toda?.name} />;
}

/** A missing TODA or an unreachable database falls back to the plain form. */
async function findToda(id: string) {
  try {
    return await getToda(id);
  } catch (error) {
    console.error("[toda] Could not load the TODA to suggest a position for", error);
    return null;
  }
}
