import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { TodaTerminalsEditor } from "@/components/admin/toda-terminals-editor";
import { cityBoundary } from "@/lib/data";
import { requireAdmin } from "@/lib/session";
import { getToda } from "@/lib/toda/queries";

export const metadata: Metadata = { title: "Edit TODA positions" };

export default async function EditTodaPositionsPage({ params }: PageProps<"/[lang]/admin/todas/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const toda = await getToda(id);
  if (!toda) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">{toda.name}</h1>
        <AdminNav current="todas" />
      </div>
      <p className="text-muted-foreground">
        Where this TODA waits for passengers. The first terminal is the main one; the others show as
        &ldquo;Also waits at&rdquo; in the directory and each needs a pin.{" "}
        <Link href="/admin/todas?status=PUBLISHED" className="font-semibold text-primary underline-offset-4 hover:underline">
          Back to published TODAs
        </Link>
      </p>
      <TodaTerminalsEditor
        id={toda.id}
        terminals={[
          { terminalDescription: toda.terminalDescription, barangay: toda.barangay, lat: toda.lat, lng: toda.lng },
          ...toda.connectedTerminals,
        ]}
        boundary={cityBoundary}
      />
    </main>
  );
}
