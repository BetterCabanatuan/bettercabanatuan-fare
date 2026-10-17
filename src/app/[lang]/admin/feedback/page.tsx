import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { FeedbackTable } from "@/components/admin/feedback-table";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { countFeedback, listFeedback, type FeedbackStatus } from "@/lib/feedback/queries";
import { requireAdmin, type Admin } from "@/lib/session";

export const metadata: Metadata = { title: "Rider feedback" };

const TABS: { status: FeedbackStatus; label: string }[] = [
  { status: "NEW", label: "New" },
  { status: "RESOLVED", label: "Resolved" },
];

const dateTime = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export default async function AdminFeedbackPage({ searchParams }: PageProps<"/[lang]/admin/feedback">) {
  // Checked before anything streams, so a signed-out visitor gets a real 307 to the
  // sign-in page instead of a redirect sent mid-stream with a 200.
  const admin = await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Rider feedback</h1>
        <AdminNav current="feedback" />
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Loading feedback…</p>}>
        <FeedbackQueue admin={admin} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function FeedbackQueue({
  admin,
  searchParams,
}: { admin: Admin } & Pick<PageProps<"/[lang]/admin/feedback">, "searchParams">) {
  const { status: rawStatus } = await searchParams;
  const status = TABS.find((tab) => tab.status === rawStatus)?.status ?? "NEW";
  const [entries, counts] = await Promise.all([listFeedback(status), countFeedback()]);
  // The table is a Client Component, so rows go over as plain values: dates as ISO
  // strings for sorting, plus the text to show.
  const rows = entries.map(({ createdAt, resolvedAt, ...entry }) => ({
    ...entry,
    createdAt: createdAt.toISOString(),
    sent: dateTime.format(createdAt),
    resolved: resolvedAt && dateTime.format(resolvedAt),
  }));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>Signed in as {admin.email}</p>
        <SignOutButton />
      </div>

      <nav aria-label="Feedback status">
        <ul className="flex gap-1 border-b">
          {TABS.map((tab) => (
            <li key={tab.status}>
              <Link
                href={tab.status === "NEW" ? "/admin/feedback" : `/admin/feedback?status=${tab.status}`}
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

      <FeedbackTable status={status} rows={rows} />
    </>
  );
}
