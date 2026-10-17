"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { createDataTableColumnHelper, DataTable, type DataTableFacet } from "@/components/admin/data-table";

export type PublishedTodaRow = {
  id: string;
  name: string;
  terminalDescription: string;
  barangay: string;
  /** Terminals besides the main one. */
  otherTerminals: number;
};

const helper = createDataTableColumnHelper<PublishedTodaRow>();

const columns = helper.columns([
  helper.accessor("name", {
    header: "TODA",
    cell: ({ getValue }) => <span className="block min-w-40 font-semibold whitespace-normal">{getValue()}</span>,
  }),
  helper.accessor("barangay", { header: "Barangay" }),
  helper.accessor("terminalDescription", {
    header: "Main terminal",
    enableSorting: false,
    cell: ({ getValue }) => <span className="block min-w-48 whitespace-normal">{getValue()}</span>,
  }),
  helper.accessor("otherTerminals", {
    header: "Other terminals",
    enableGlobalFilter: false,
    cell: ({ getValue }) => <span className="tabular-nums">{getValue() || "None"}</span>,
  }),
  helper.display({
    id: "edit",
    header: () => <span className="sr-only">Edit</span>,
    cell: ({ row }) => (
      <Link
        href={`/admin/todas/${row.original.id}`}
        className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
      >
        Edit positions<span className="sr-only"> of {row.original.name}</span>
      </Link>
    ),
  }),
]);

const facets: DataTableFacet[] = [{ columnId: "barangay", label: "Barangay" }];

export function PublishedTodaTable({ rows }: { rows: PublishedTodaRow[] }): ReactNode {
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchLabel="Search by TODA, barangay or terminal"
      facets={facets}
      emptyMessage="No TODAs are listed yet."
    />
  );
}
