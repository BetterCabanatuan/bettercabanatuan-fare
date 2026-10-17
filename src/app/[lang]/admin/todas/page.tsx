import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { PublishedTodaTable } from "@/components/admin/published-toda-table";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { TodaSubmissionTable } from "@/components/admin/toda-submission-table";
import type { SubmissionStatus } from "@/lib/db";
import { requireAdmin, type Admin } from "@/lib/session";
import { countAdminTabs, listSubmissions, listVerifiedTodas, type AdminTodaTab } from "@/lib/toda/queries";
import { todaSlug } from "@/lib/toda/submission";

export const metadata: Metadata = { title: "Review TODA submissions" };

const TABS: { status: AdminTodaTab; label: string }[] = [
  { status: "PENDING", label: "Pending" },
  { status: "VERIFIED", label: "Verified" },
  { status: "REJECTED", label: "Rejected" },
  { status: "PUBLISHED", label: "Published" },
];

const dateTime = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export default async function AdminTodasPage({ searchParams }: PageProps<"/[lang]/admin/todas">) {
  // Checked before anything streams, so a signed-out visitor gets a real 307 to the
  // sign-in page instead of a redirect sent mid-stream with a 200.
  const admin = await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">TODA submissions</h1>
        <AdminNav current="todas" />
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Loading submissions…</p>}>
        <ReviewQueue admin={admin} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ReviewQueue({
  admin,
  searchParams,
}: { admin: Admin } & Pick<PageProps<"/[lang]/admin/todas">, "searchParams">) {
  const { status: rawStatus } = await searchParams;
  const status = TABS.find((tab) => tab.status === rawStatus)?.status ?? "PENDING";
  const counts = await countAdminTabs();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>Signed in as {admin.email}</p>
        <SignOutButton />
      </div>

      <nav aria-label="Submission status">
        <ul className="flex gap-1 border-b">
          {TABS.map((tab) => (
            <li key={tab.status}>
              <Link
                href={tab.status === "PENDING" ? "/admin/todas" : `/admin/todas?status=${tab.status}`}
                aria-current={tab.status === status ? "page" : undefined}
                className="-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-semibold text-muted-foreground hover:text-foreground aria-[current=page]:border-primary aria-[current=page]:text-primary"
              >
                {tab.label}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">{counts[tab.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {status === "PUBLISHED" ? <PublishedTodas /> : <SubmissionList status={status} />}
    </>
  );
}

async function PublishedTodas() {
  const todas = await listVerifiedTodas();
  const rows = todas.map(({ id, name, terminalDescription, barangay, connectedTerminals }) => ({
    id,
    name,
    terminalDescription,
    barangay,
    otherTerminals: connectedTerminals.length,
  }));
  return <PublishedTodaTable rows={rows} />;
}

async function SubmissionList({ status }: { status: SubmissionStatus }) {
  const { submissions, existingIds } = await listSubmissions(status);
  // The table is a Client Component, so rows go over as plain values: dates as ISO
  // strings for sorting, plus the text to show.
  const rows = submissions.map(({ createdAt, reviewedAt, ...submission }) => ({
    ...submission,
    createdAt: createdAt.toISOString(),
    sent: dateTime.format(createdAt),
    reviewed: reviewedAt && dateTime.format(reviewedAt),
    updatesExisting: existingIds.has(todaSlug(submission.name)),
  }));
  return <TodaSubmissionTable status={status} rows={rows} />;
}
