import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { RouteSubmissionTable } from "@/components/admin/route-submission-table";
import { SignOutButton } from "@/components/admin/sign-out-button";
import type { SubmissionStatus } from "@/lib/db";
import { countRouteSubmissions, listRouteSubmissions, routeSlug } from "@/lib/routes/queries";
import { requireAdmin, type Admin } from "@/lib/session";

export const metadata: Metadata = { title: "Review jeepney route submissions" };

const TABS: { status: SubmissionStatus; label: string }[] = [
  { status: "PENDING", label: "Pending" },
  { status: "VERIFIED", label: "Verified" },
  { status: "REJECTED", label: "Rejected" },
];

const dateTime = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export default async function AdminRoutesPage({ searchParams }: PageProps<"/[lang]/admin/routes">) {
  // Checked before anything streams, so a signed-out visitor gets a real 307 to the
  // sign-in page instead of a redirect sent mid-stream with a 200.
  const admin = await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Jeepney route submissions</h1>
        <AdminNav current="routes" />
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
}: { admin: Admin } & Pick<PageProps<"/[lang]/admin/routes">, "searchParams">) {
  const { status: rawStatus } = await searchParams;
  const status = TABS.find((tab) => tab.status === rawStatus)?.status ?? "PENDING";
  const [{ submissions, existingIds }, counts] = await Promise.all([
    listRouteSubmissions(status),
    countRouteSubmissions(),
  ]);
  // The table is a Client Component, so rows go over as plain values: dates as ISO
  // strings for sorting, plus the text to show.
  const rows = submissions.map(({ createdAt, reviewedAt, ...submission }) => ({
    ...submission,
    createdAt: createdAt.toISOString(),
    sent: dateTime.format(createdAt),
    reviewed: reviewedAt && dateTime.format(reviewedAt),
    updatesExisting: existingIds.has(routeSlug(submission.name)),
  }));

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
                href={tab.status === "PENDING" ? "/admin/routes" : `/admin/routes?status=${tab.status}`}
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

      <RouteSubmissionTable status={status} rows={rows} />
    </>
  );
}
