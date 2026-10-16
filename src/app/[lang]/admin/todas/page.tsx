import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ReviewActions } from "@/components/admin/review-actions";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Badge } from "@/components/ui/badge";
import type { SubmissionStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/session";
import { countSubmissions, listSubmissions } from "@/lib/toda/queries";
import { todaSlug } from "@/lib/toda/submission";

export const metadata: Metadata = { title: "Review TODA submissions" };

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

export default function AdminTodasPage({ searchParams }: PageProps<"/[lang]/admin/todas">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">TODA submissions</h1>
        <nav aria-label="Admin sections" className="flex gap-4 text-sm font-semibold">
          <span aria-current="page" className="text-muted-foreground">
            TODAs
          </span>
          <Link href="/admin/routes" className="text-primary underline-offset-4 hover:underline">
            Routes
          </Link>
        </nav>
      </div>
      {/* Everything below reads the session or the query, so it renders per request. */}
      <Suspense fallback={<p className="text-muted-foreground">Loading submissions…</p>}>
        <ReviewQueue searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ReviewQueue({ searchParams }: Pick<PageProps<"/[lang]/admin/todas">, "searchParams">) {
  const admin = await requireAdmin();
  const { status: rawStatus } = await searchParams;
  const status = TABS.find((tab) => tab.status === rawStatus)?.status ?? "PENDING";
  const [{ submissions, existingIds }, counts] = await Promise.all([listSubmissions(status), countSubmissions()]);

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

      {submissions.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-muted-foreground">
          {status === "PENDING" ? "Nothing to review. New submissions will show up here." : "None yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {submissions.map((submission) => {
            const updatesExisting = existingIds.has(todaSlug(submission.name));
            return (
              <li key={submission.id} className="flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold">{submission.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      Ref <span className="font-mono">{submission.id.slice(-6).toUpperCase()}</span> · sent{" "}
                      {dateTime.format(submission.createdAt)}
                    </p>
                  </div>
                  {status === "PENDING" && updatesExisting && (
                    <Badge variant="secondary">Same name as a listed TODA: verifying updates it</Badge>
                  )}
                </div>

                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <Detail label="Terminal">
                    {submission.terminalDescription}, {submission.barangay}
                    {submission.lat !== null && submission.lng !== null && (
                      <>
                        {" · "}
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${submission.lat}&mlon=${submission.lng}#map=18/${submission.lat}/${submission.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-primary underline-offset-4 hover:underline"
                        >
                          View pin
                        </a>
                      </>
                    )}
                  </Detail>
                  <Detail label="Barangays served">
                    {submission.barangaysServed.length ? submission.barangaysServed.join(", ") : "Not given"}
                  </Detail>
                  <Detail label="Official contact">{submission.officialContact ?? "Not given"}</Detail>
                  <Detail label="Tricycles">{submission.units ?? "Not given"}</Detail>
                  <Detail label="Sent by (private)">
                    {[submission.submitterName, submission.submitterContact].filter(Boolean).join(" · ") || "Anonymous"}
                  </Detail>
                  {submission.notes && <Detail label="Notes">{submission.notes}</Detail>}
                </dl>

                {status === "PENDING" ? (
                  <ReviewActions id={submission.id} updatesExisting={updatesExisting} />
                ) : (
                  <p className="border-t pt-3 text-sm text-muted-foreground">
                    {status === "VERIFIED" ? "Verified" : "Rejected"}
                    {submission.reviewedBy && ` by ${submission.reviewedBy.email}`}
                    {submission.reviewedAt && ` on ${dateTime.format(submission.reviewedAt)}`}
                    {submission.rejectionReason && (
                      <>
                        {". Reason: "}
                        <span className="text-foreground">{submission.rejectionReason}</span>
                      </>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-semibold text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}
