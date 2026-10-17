"use client";

import type { ReactNode } from "react";

import { clearPublicName } from "@/app/[lang]/admin/routes/actions";
import { createDataTableColumnHelper, DataTable, type DataTableFacet } from "@/components/admin/data-table";
import { RouteReviewActions } from "@/components/admin/route-review-actions";
import { RouteRoadPreview } from "@/components/admin/route-road-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/database-types";
import type { JeepType, SubmissionStatus } from "@/lib/db";
import { formatPeso } from "@/lib/fare";
import type { RouteStop } from "@/lib/routes/waypoints";

export type RouteSubmissionRow = Omit<Tables<"route_submission">, "reviewedAt" | "updatedAt" | "waypoints"> & {
  stops: RouteStop[];
  /** How the sender's route suggestions went so far. */
  senderRecord?: Record<SubmissionStatus, number>;
  publicName: string | null;
  /** `createdAt` and `reviewedAt` formatted on the server, so server and browser print the same text. */
  sent: string;
  reviewed: string | null;
  /** Shares its name with a published route, so verifying updates that route. */
  updatesExisting: boolean;
};

const JEEP_TYPE_LABEL: Record<JeepType, string> = {
  TRADITIONAL: "Traditional",
  MODERN: "Modern",
  UNKNOWN: "Not given (priced as traditional)",
};

const PROVIDER_LABEL: Record<string, string> = { google: "Google", facebook: "Facebook" };

const senderName = (row: RouteSubmissionRow): string =>
  [row.submitterName, row.submitterContact].filter(Boolean).join(" · ") || (row.userId ? "Signed in" : "Anonymous");

const helper = createDataTableColumnHelper<RouteSubmissionRow>();

const columns = helper.columns([
  helper.accessor("name", {
    header: "Route",
    cell: ({ row }) => (
      <span className="flex min-w-40 flex-col items-start gap-1 whitespace-normal">
        <span className="font-semibold">{row.original.name}</span>
        {row.original.status === "PENDING" && row.original.updatesExisting && (
          <Badge variant="secondary">Updates a route</Badge>
        )}
      </span>
    ),
  }),
  helper.accessor((row) => `${row.fromName} → ${row.toName}`, {
    id: "ends",
    header: "From → To",
    enableSorting: false,
    cell: ({ getValue }) => <span className="block min-w-48 whitespace-normal">{getValue()}</span>,
  }),
  helper.accessor((row) => JEEP_TYPE_LABEL[row.jeepType], { id: "jeepType", header: "Jeep type" }),
  helper.accessor(senderName, {
    id: "sender",
    header: "Sent by",
    cell: ({ getValue }) => <span className="block min-w-32 whitespace-normal">{getValue()}</span>,
  }),
  helper.accessor((row) => row.id.slice(-6).toUpperCase(), {
    id: "ref",
    header: "Ref",
    enableSorting: false,
    cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
  }),
  helper.accessor("createdAt", {
    header: "Sent",
    cell: ({ row }) => <time dateTime={row.original.createdAt}>{row.original.sent}</time>,
  }),
]);

const facets: DataTableFacet[] = [{ columnId: "jeepType", label: "Jeep type" }];

const renderDetails = (submission: RouteSubmissionRow): ReactNode => <SubmissionDetails submission={submission} />;

export function RouteSubmissionTable({ status, rows }: { status: SubmissionStatus; rows: RouteSubmissionRow[] }): ReactNode {
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchLabel="Search by route, place, sender or ref"
      facets={facets}
      emptyMessage={status === "PENDING" ? "Nothing to review. New submissions will show up here." : "None yet."}
      renderDetails={renderDetails}
      detailsLabel={status === "PENDING" ? "Review" : "Details"}
    />
  );
}

function SubmissionDetails({ submission }: { submission: RouteSubmissionRow }) {
  return (
    <div className="flex flex-col gap-4">
      {submission.status === "PENDING" && submission.updatesExisting && (
        <Badge variant="secondary" className="self-start">
          Same name as a published route: verifying updates it
        </Badge>
      )}

      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <Detail label="From (A)">
          <Pin name={submission.fromName} lat={submission.fromLat} lng={submission.fromLng} />
        </Detail>
        <Detail label="To (B)">
          <Pin name={submission.toName} lat={submission.toLat} lng={submission.toLng} />
        </Detail>
        <Detail label="Stops along the road">
          {submission.stops.length === 0 ? (
            "None; the road is the shortest one from A to B"
          ) : (
            <ol className="flex flex-col gap-0.5">
              {submission.stops.map((stop, index) => (
                <li key={stop.id}>
                  <Pin name={`Stop ${index + 1}`} lat={stop.position[1]} lng={stop.position[0]} />
                </li>
              ))}
            </ol>
          )}
        </Detail>
        <Detail label="Via">{submission.via ?? "Not given"}</Detail>
        <Detail label="Jeep type">{JEEP_TYPE_LABEL[submission.jeepType]}</Detail>
        <Detail label="Fare paid, end to end">
          {submission.farePaid === null ? "Not given" : formatPeso(submission.farePaid)}
        </Detail>
        <Detail label="Sent by (private)">
          <Sender submission={submission} />
        </Detail>
        {submission.notes && <Detail label="Notes">{submission.notes}</Detail>}
      </dl>

      <RouteRoadPreview
        a={[submission.fromLng, submission.fromLat]}
        b={[submission.toLng, submission.toLat]}
        stops={submission.stops}
      />

      {submission.status === "PENDING" ? (
        <RouteReviewActions id={submission.id} updatesExisting={submission.updatesExisting} />
      ) : (
        <p className="border-t pt-3 text-sm text-muted-foreground">
          {submission.status === "VERIFIED" ? "Verified" : "Rejected"}
          {submission.reviewedByEmail && ` by ${submission.reviewedByEmail}`}
          {submission.reviewed && ` on ${submission.reviewed}`}
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
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-semibold text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

/** Who sent a suggestion and how their earlier ones went. */
function Sender({ submission }: { submission: RouteSubmissionRow }) {
  const details = [submission.submitterName, submission.submitterContact].filter(Boolean).join(" · ");
  if (!submission.userId) {
    return <>{details ? `${details} (typed in; sent before sign-in was required)` : "Anonymous (sent before sign-in was required)"}</>;
  }
  const provider = submission.provider ? (PROVIDER_LABEL[submission.provider] ?? submission.provider) : null;
  const record = submission.senderRecord;
  return (
    <>
      {[details || "Signed in, no name or email shared", provider].filter(Boolean).join(" · ")}
      {record && (
        <span className="block text-muted-foreground">
          {record.VERIFIED} approved · {record.REJECTED} rejected · {record.PENDING} pending
        </span>
      )}
      {submission.publicName && (
        <form action={clearPublicName} className="flex flex-wrap items-center gap-2">
          <span>
            Board name: <span className="font-semibold">“{submission.publicName}”</span>
          </span>
          <input type="hidden" name="userId" value={submission.userId} />
          <Button type="submit" variant="outline" size="sm">
            Clear public name
          </Button>
        </form>
      )}
    </>
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
