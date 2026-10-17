import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { deleteRecord } from "@/app/[lang]/admin/data/actions";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { ResolveFeedbackButton } from "@/components/admin/resolve-feedback-button";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { countFeedback, listFeedback, type FeedbackStatus } from "@/lib/feedback/queries";
import type { FeedbackTopic } from "@/lib/feedback/submission";
import { requireAdmin, type Admin } from "@/lib/session";

export const metadata: Metadata = { title: "Rider feedback" };

const TABS: { status: FeedbackStatus; label: string }[] = [
  { status: "NEW", label: "New" },
  { status: "RESOLVED", label: "Resolved" },
];

const TOPIC_LABEL: Record<FeedbackTopic, string> = {
  WRONG_FARE: "Wrong fare",
  WRONG_ROUTE: "Wrong route or road",
  APP_PROBLEM: "Something doesn't work",
  SUGGESTION: "Idea or suggestion",
  OTHER: "Something else",
};

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

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-muted-foreground">
          {status === "NEW" ? "No new feedback. Messages from riders will show up here." : "None yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <Badge variant="secondary">{TOPIC_LABEL[entry.topic]}</Badge>
                  <p className="text-xs text-muted-foreground">
                    Ref <span className="font-mono">{entry.id.slice(-6).toUpperCase()}</span> · sent{" "}
                    {dateTime.format(entry.createdAt)} · in {entry.locale === "tl" ? "Tagalog" : "English"}
                  </p>
                </div>
              </div>

              <p className="whitespace-pre-wrap break-words">{entry.message}</p>

              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div className="flex flex-col gap-0.5">
                  <dt className="font-semibold text-muted-foreground">From (private)</dt>
                  <dd className="break-words">
                    {entry.userName ?? "No name"}
                    {entry.userEmail && (
                      <>
                        {" · "}
                        <a href={`mailto:${entry.userEmail}`} className="font-semibold text-primary underline-offset-4 hover:underline">
                          {entry.userEmail}
                        </a>
                      </>
                    )}{" "}
                    <span className="text-muted-foreground">via {entry.provider}</span>
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="font-semibold text-muted-foreground">Page they were on</dt>
                  <dd className="break-all">
                    {entry.pagePath ? (
                      <Link href={entry.pagePath} className="font-mono text-xs font-semibold text-primary underline-offset-4 hover:underline">
                        {entry.pagePath}
                      </Link>
                    ) : (
                      "Not given"
                    )}
                  </dd>
                </div>
              </dl>

              {status === "NEW" ? (
                <div className="flex flex-wrap items-start gap-3">
                  <ResolveFeedbackButton id={entry.id} />
                  <ConfirmDeleteButton
                    label="Delete"
                    warning="Deletes this feedback, for spam or a deletion request."
                    action={deleteRecord.bind(null, "feedback", entry.id)}
                  />
                </div>
              ) : (
                <p className="border-t pt-3 text-sm text-muted-foreground">
                  Resolved
                  {entry.resolvedByEmail && ` by ${entry.resolvedByEmail}`}
                  {entry.resolvedAt && ` on ${dateTime.format(entry.resolvedAt)}`}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
