import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TodaDirectory } from "@/components/toda/toda-directory";
import { listVerifiedTodas } from "@/lib/toda/queries";

export const metadata: Metadata = {
  title: "TODA directory",
  description:
    "Find the tricycle operators and drivers' association (TODA) that serves your barangay in Cabanatuan City.",
  alternates: { canonical: "/toda" },
};

export default async function TodaPage() {
  const todas = await listVerifiedTodas();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight">TODA directory</h1>
          <p className="text-pretty text-muted-foreground">
            Which TODA serves your area? There is no public list from the city yet, so this one is built
            from reports by residents. An admin checks each one before it shows here.
          </p>
        </div>
        <Link
          href="/toda/submit"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg bg-highlight px-5 font-bold text-highlight-foreground transition-colors hover:bg-highlight/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:self-auto"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add a TODA
        </Link>
      </header>

      {todas.length === 0 ? (
        <section className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
          <h2 className="text-lg font-bold">No TODAs listed yet</h2>
          <p className="max-w-xl text-muted-foreground">
            Know the TODA at your terminal? Tell us its name and where it waits for passengers. It will
            appear here once an admin checks it.
          </p>
          <Link href="/toda/submit" className="font-semibold text-primary underline-offset-4 hover:underline">
            Add the first TODA
          </Link>
        </section>
      ) : (
        <TodaDirectory todas={todas} />
      )}
    </main>
  );
}
