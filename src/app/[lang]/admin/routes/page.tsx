import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { RouteReviewActions } from "@/components/admin/route-review-actions";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Badge } from "@/components/ui/badge";
import type { JeepType, SubmissionStatus } from "@/lib/db";
import { formatPeso } from "@/lib/fare";
import { countRouteSubmissions, listRouteSubmissions, routeSlug } from "@/lib/routes/queries";
import { requireAdmin, type Admin } from "@/lib/session";

export const metadata: Metadata = { title: "Review jeepney route submissions" };

const TABS: { status: SubmissionStatus; label: string }[] = [
  { status: "PENDING", label: "Pending" },
  { status: "VERIFIED", label: "Verified" },
  { status: "REJECTED", label: "Rejected" },
];

const JEEP_TYPE_LABEL: Record<JeepType, string> = {
  TRADITIONAL: "Traditional",
  MODERN: "Modern",
  UNKNOWN: "Not given (priced as traditional)",
};

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
        <nav aria-label="Admin sections" className="flex gap-4 text-sm font-semibold">
          <Link href="/admin/todas" className="text-primary underline-offset-4 hover:underline">
            TODAs
          </Link>
          <span aria-current="page" className="text-muted-foreground">
            Routes
          </span>
          <Link href="/admin/feedback" className="text-primary underline-offset-4 hover:underline">
            Feedback
          </Link>
        </nav>
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

      {submissions.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-muted-foreground">
          {status === "PENDING" ? "Nothing to review. New submissions will show up here." : "None yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {submissions.map((submission) => {
            const updatesExisting = existingIds.has(routeSlug(submission.name));
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
                    <Badge variant="secondary">Same name as a published route: verifying updates it</Badge>
                  )}
                </div>

                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <Detail label="From (A)">
                    <Pin name={submission.fromName} lat={submission.fromLat} lng={submission.fromLng} />
                  </Detail>
                  <Detail label="To (B)">
                    <Pin name={submission.toName} lat={submission.toLat} lng={submission.toLng} />
                  </Detail>
                  <Detail label="Via">{submission.via ?? "Not given"}</Detail>
                  <Detail label="Jeep type">{JEEP_TYPE_LABEL[submission.jeepType]}</Detail>
                  <Detail label="Fare paid, end to end">
                    {submission.farePaid === null ? "Not given" : formatPeso(submission.farePaid)}
                  </Detail>
                  <Detail label="Sent by (private)">
                    {[submission.submitterName, submission.submitterContact].filter(Boolean).join(" · ") || "Anonymous"}
                  </Detail>
                  {submission.notes && <Detail label="Notes">{submission.notes}</Detail>}
                </dl>

                {status === "PENDING" ? (
                  <RouteReviewActions id={submission.id} updatesExisting={updatesExisting} />
                ) : (
                  <p className="border-t pt-3 text-sm text-muted-foreground">
                    {status === "VERIFIED" ? "Verified" : "Rejected"}
                    {submission.reviewedByEmail && ` by ${submission.reviewedByEmail}`}
                    {submission.reviewedAt && ` on ${dateTime.format(submission.reviewedAt)}`}
                    {submission.routeId && (
                      <>
                        {" · published as "}
                        <span className="font-mono text-foreground">{submission.routeId}</span>
                      </>
                    )}
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

/** A named point with its coordinates linked to OpenStreetMap, so admins can eyeball the pin. */
function Pin({ name, lat, lng }: { name: string; lat: number; lng: number }) {
  return (
    <>
      {name}
      {" · "}
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs font-semibold text-primary underline-offset-4 hover:underline"
      >
        {lat.toFixed(5)}, {lng.toFixed(5)}
      </a>
    </>
  );
}
