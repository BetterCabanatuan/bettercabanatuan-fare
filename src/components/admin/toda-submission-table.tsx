"use client";

import type { ReactNode } from "react";

import { createDataTableColumnHelper, DataTable, type DataTableFacet } from "@/components/admin/data-table";
import { ReviewActions } from "@/components/admin/review-actions";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/lib/database-types";
import type { SubmissionStatus } from "@/lib/db";

export type TodaSubmissionRow = Omit<
  Tables<"toda_submission">,
  "barangaysServed" | "reviewedAt" | "updatedAt" | "todaId"
> & {
  barangaysServed: string[];
  /** `createdAt` and `reviewedAt` formatted on the server, so server and browser print the same text. */
  sent: string;
  reviewed: string | null;
  /** Shares its name with a listed TODA, so verifying updates that listing. */
  updatesExisting: boolean;
};

const helper = createDataTableColumnHelper<TodaSubmissionRow>();

const columns = helper.columns([
  helper.accessor("name", {
    header: "TODA",
    cell: ({ row }) => (
      <span className="flex min-w-40 flex-col items-start gap-1 whitespace-normal">
        <span className="font-semibold">{row.original.name}</span>
        {row.original.status === "PENDING" && row.original.updatesExisting && (
          <Badge variant="secondary">{row.original.connectedTerminal ? "Adds a terminal" : "Updates a listing"}</Badge>
        )}
      </span>
    ),
  }),
  helper.accessor("barangay", { header: "Barangay" }),
  helper.accessor("terminalDescription", {
    header: "Terminal",
    enableSorting: false,
    cell: ({ getValue }) => <span className="block min-w-48 whitespace-normal">{getValue()}</span>,
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

const facets: DataTableFacet[] = [{ columnId: "barangay", label: "Barangay" }];

const renderDetails = (submission: TodaSubmissionRow): ReactNode => <SubmissionDetails submission={submission} />;

export function TodaSubmissionTable({ status, rows }: { status: SubmissionStatus; rows: TodaSubmissionRow[] }): ReactNode {
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchLabel="Search by TODA, barangay, terminal or ref"
      facets={facets}
      emptyMessage={status === "PENDING" ? "Nothing to review. New submissions will show up here." : "None yet."}
      renderDetails={renderDetails}
      detailsLabel={status === "PENDING" ? "Review" : "Details"}
    />
  );
}

function SubmissionDetails({ submission }: { submission: TodaSubmissionRow }) {
  return (
    <div className="flex flex-col gap-4">
      {submission.status === "PENDING" && submission.updatesExisting && (
        <Badge variant="secondary" className="self-start">
          {submission.connectedTerminal
            ? "Another terminal for a listed TODA: verifying adds it"
            : "Same name as a listed TODA: verifying updates it"}
        </Badge>
      )}

      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <Detail label={submission.connectedTerminal ? "Another terminal" : "Terminal"}>
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

      {submission.status === "PENDING" ? (
        <ReviewActions id={submission.id} updatesExisting={submission.updatesExisting} />
      ) : (
        <p className="border-t pt-3 text-sm text-muted-foreground">
          {submission.status === "VERIFIED" ? "Verified" : "Rejected"}
          {submission.reviewedByEmail && ` by ${submission.reviewedByEmail}`}
          {submission.reviewed && ` on ${submission.reviewed}`}
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
