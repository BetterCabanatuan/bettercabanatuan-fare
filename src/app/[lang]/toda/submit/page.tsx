import type { Metadata } from "next";

import { SubmissionForm } from "@/components/toda/submission-form";
import { cityBoundary } from "@/lib/data";

export const metadata: Metadata = {
  title: "Add a TODA",
  description: "Tell us about a TODA in Cabanatuan City and where its terminal is.",
  alternates: { canonical: "/toda/submit" },
};

export default function SubmitTodaPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Add a TODA</h1>
        <p className="text-pretty text-muted-foreground">
          Help commuters find the right tricycle. Tell us the TODA&apos;s name and where its terminal is.
          Fields marked <span className="text-destructive">*</span> are required.
        </p>
      </header>
      <SubmissionForm boundary={cityBoundary} />
    </main>
  );
}
