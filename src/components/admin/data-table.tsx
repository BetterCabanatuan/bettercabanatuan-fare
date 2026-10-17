"use client";

import {
  columnFacetingFeature,
  columnFilteringFeature,
  createColumnHelper,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnHelper,
  type SortDirection,
  type TableOptions,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, SearchIcon } from "lucide-react";
import { Fragment, useId, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

// TanStack Table v9 only installs the APIs a table registers, and wants the registry at
// module scope so it stays stable between renders.
const features = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  columnFacetingFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString, equalsString: filterFn_equalsString },
  // `sortFn: "auto"` picks these for text columns; ISO dates sort correctly as text.
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

type DataTableFeatures = typeof features;
type RowWithId = { id: string };

/** Column helper typed for DataTable, so column definitions get its sort and filter options. */
export function createDataTableColumnHelper<TData extends RowWithId>(): ColumnHelper<DataTableFeatures, TData> {
  return createColumnHelper<DataTableFeatures, TData>();
}

const PAGE_SIZE = 25;
const initialState = { pagination: { pageIndex: 0, pageSize: PAGE_SIZE } };
// Column filters only come from the facet selects, which pick one exact value; the
// default "includes" match would let "Bitas" also keep "Bitas Norte".
const defaultColumn = { filterFn: "equalsString" } as const;
const getRowId = (row: RowWithId): string => row.id;
const getRowCanExpand = (): boolean => true;

const ARIA_SORT: Record<SortDirection, "ascending" | "descending"> = { asc: "ascending", desc: "descending" };

/** A column offered as a select above the table, listing each value it holds. */
export type DataTableFacet = { columnId: string; label: string };

type DataTableProps<TData extends RowWithId> = {
  columns: TableOptions<DataTableFeatures, TData>["columns"];
  data: TData[];
  searchLabel: string;
  facets?: DataTableFacet[];
  /** Shown instead of the table when there are no rows at all. */
  emptyMessage: string;
  /** Content for a panel under the row, opened by a button at the end of the row. */
  renderDetails?: (row: TData) => ReactNode;
  detailsLabel?: string;
};

export function DataTable<TData extends RowWithId>({
  columns,
  data,
  searchLabel,
  facets = [],
  emptyMessage,
  renderDetails,
  detailsLabel = "Details",
}: DataTableProps<TData>): ReactNode {
  const id = useId();
  const table = useTable({
    features,
    columns,
    data,
    getRowId,
    getRowCanExpand,
    defaultColumn,
    initialState,
    globalFilterFn: "includesString",
  });

  if (data.length === 0) {
    return <p className="rounded-xl border border-dashed p-6 text-muted-foreground">{emptyMessage}</p>;
  }

  const rows = table.getRowModel().rows;
  const shown = table.getFilteredRowModel().rows.length;
  const columnCount = table.getAllLeafColumns().length + (renderDetails ? 1 : 0);
  const { pageIndex } = table.state.pagination;
  const pageCount = table.getPageCount();
  const clearFilters = (): void => {
    table.setGlobalFilter("");
    table.resetColumnFilters();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <Label htmlFor={`${id}-search`}>{searchLabel}</Label>
          <InputGroup className="h-11 bg-background">
            <InputGroupAddon align="inline-start">
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              id={`${id}-search`}
              type="search"
              autoComplete="off"
              value={String(table.state.globalFilter ?? "")}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
            />
          </InputGroup>
        </div>
        {facets.map((facet) => {
          const column = table.getColumn(facet.columnId);
          if (!column) return null;
          return (
            <FacetSelect
              key={facet.columnId}
              id={`${id}-${facet.columnId}`}
              label={facet.label}
              counts={column.getFacetedUniqueValues()}
              value={String(column.getFilterValue() ?? "")}
              onChange={(value) => column.setFilterValue(value || undefined)}
            />
          );
        })}
        <p aria-live="polite" className="min-h-11 content-center text-sm text-muted-foreground tabular-nums">
          {shown} of {data.length}
        </p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id} aria-sort={sorted ? ARIA_SORT[sorted] : undefined} className="px-3">
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-2.5"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          <SortIcon sorted={sorted} />
                        </Button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
                {renderDetails && (
                  <TableHead className="px-3">
                    <span className="sr-only">{detailsLabel}</span>
                  </TableHead>
                )}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="p-6 text-center whitespace-normal text-muted-foreground">
                  Nothing matches these filters.{" "}
                  <Button variant="link" className="h-auto p-0" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const isOpen = row.getIsExpanded();
                const detailsId = `${id}-${row.id}-details`;
                return (
                  <Fragment key={row.id}>
                    <TableRow>
                      {row.getAllCells().map((cell) => (
                        <TableCell key={cell.id} className="px-3">
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                      {renderDetails && (
                        <TableCell className="px-3 text-right">
                          <Button
                            variant="outline"
                            aria-expanded={isOpen}
                            aria-controls={isOpen ? detailsId : undefined}
                            onClick={() => row.toggleExpanded()}
                          >
                            {detailsLabel}
                            <ChevronDown aria-hidden className={cn("transition-transform", isOpen && "rotate-180")} />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                    {renderDetails && isOpen && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell id={detailsId} colSpan={columnCount} className="p-5 whitespace-normal">
                          {renderDetails(row.original)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <nav aria-label="Pages" className="flex flex-wrap items-center justify-end gap-2">
          <p className="text-sm text-muted-foreground tabular-nums">
            Page {pageIndex + 1} of {pageCount}
          </p>
          <Button variant="outline" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            Previous
          </Button>
          <Button variant="outline" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}

function SortIcon({ sorted }: { sorted: false | SortDirection }) {
  if (sorted === "asc") return <ArrowUp aria-hidden />;
  if (sorted === "desc") return <ArrowDown aria-hidden />;
  return <ArrowUpDown aria-hidden className="text-muted-foreground" />;
}

type FacetSelectProps = {
  id: string;
  label: string;
  /** Each value in the column with how many rows hold it, given the other filters. */
  counts: Map<unknown, number>;
  value: string;
  onChange: (value: string) => void;
};

function FacetSelect({ id, label, counts, value, onChange }: FacetSelectProps) {
  const listed = [...counts].map(([option, count]) => ({ option: String(option), count }));
  // The search can hide every row with the chosen value; keep it listed so the select
  // still shows what is filtering the table.
  const options = (value && !listed.some(({ option }) => option === value) ? [...listed, { option: value, count: 0 }] : listed)
    .sort((a, b) => a.option.localeCompare(b.option));

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value)} className="[&_select]:h-11">
        <NativeSelectOption value="">All</NativeSelectOption>
        {options.map(({ option, count }) => (
          <NativeSelectOption key={option} value={option}>
            {option} ({count})
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
