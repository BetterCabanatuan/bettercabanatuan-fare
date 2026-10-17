"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { deleteRecord } from "@/app/[lang]/admin/data/actions";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { createDataTableColumnHelper, DataTable, type DataTableFacet } from "@/components/admin/data-table";
import { ResolveFeedbackButton } from "@/components/admin/resolve-feedback-button";
import type { Enums, Tables } from "@/lib/database-types";
import type { FeedbackTopic } from "@/lib/feedback/submission";

export type FeedbackRow = Omit<Tables<"feedback">, "resolvedAt" | "updatedAt"> & {
  /** `createdAt` and `resolvedAt` formatted on the server, so server and browser print the same text. */
  sent: string;
  resolved: string | null;
};

const TOPIC_LABEL: Record<FeedbackTopic, string> = {
  WRONG_FARE: "Wrong fare",
  WRONG_ROUTE: "Wrong route or road",
  APP_PROBLEM: "Something doesn't work",
  SUGGESTION: "Idea or suggestion",
  OTHER: "Something else",
};

const languageLabel = (row: FeedbackRow): string => (row.locale === "tl" ? "Tagalog" : "English");

const helper = createDataTableColumnHelper<FeedbackRow>();

const columns = helper.columns([
  helper.accessor((row) => TOPIC_LABEL[row.topic], { id: "topic", header: "Topic" }),
  helper.accessor("message", {
    header: "Message",
    enableSorting: false,
    cell: ({ getValue }) => <span className="line-clamp-2 min-w-64 whitespace-normal break-words">{getValue()}</span>,
  }),
  helper.accessor((row) => [row.userName, row.userEmail].filter(Boolean).join(" · ") || "No name", {
    id: "from",
    header: "From",
    cell: ({ getValue }) => <span className="block min-w-32 whitespace-normal break-words">{getValue()}</span>,
  }),
  helper.accessor(languageLabel, { id: "language", header: "Language" }),
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

const facets: DataTableFacet[] = [
  { columnId: "topic", label: "Topic" },
  { columnId: "language", label: "Language" },
];

const renderDetails = (entry: FeedbackRow): ReactNode => <FeedbackDetails entry={entry} />;

export function FeedbackTable({ status, rows }: { status: Enums<"FeedbackStatus">; rows: FeedbackRow[] }): ReactNode {
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchLabel="Search by message, sender or ref"
      facets={facets}
      emptyMessage={status === "NEW" ? "No new feedback. Messages from riders will show up here." : "None yet."}
      renderDetails={renderDetails}
      detailsLabel={status === "NEW" ? "Review" : "Details"}
    />
  );
}

function FeedbackDetails({ entry }: { entry: FeedbackRow }) {
  return (
    <div className="flex flex-col gap-4">
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

      {entry.status === "NEW" ? (
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
          {entry.resolved && ` on ${entry.resolved}`}
        </p>
      )}
    </div>
  );
}
