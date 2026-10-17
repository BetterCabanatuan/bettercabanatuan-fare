"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState } from "react";

import { useDictionary } from "@/components/shared/dictionary-provider";
import { ContactLink } from "@/components/toda/toda-cards";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sortTodas, type TodaSort, type TodaSortKey } from "@/lib/toda/directory";
import type { TodaListItem } from "@/lib/toda/queries";

/** The TODAs as a table, sortable by name or barangay, for comparing many at once. */
export function TodaTable({ todas }: { todas: TodaListItem[] }) {
  const { dict } = useDictionary();
  const [sort, setSort] = useState<TodaSort>({ key: "name", direction: "ascending" });

  // Tapping the sorted column flips it; tapping another sorts it A to Z.
  const sortBy = (key: TodaSortKey) =>
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "ascending" ? "descending" : "ascending",
    }));

  return (
    <Table className="min-w-2xl">
      <TableHeader>
        <TableRow>
          <SortableHead label={dict.toda.columnName} sortKey="name" sort={sort} onSort={sortBy} />
          <TableHead>{dict.toda.columnTerminal}</TableHead>
          <SortableHead label={dict.toda.columnBarangay} sortKey="barangay" sort={sort} onSort={sortBy} />
          <TableHead>{dict.toda.columnServes}</TableHead>
          <TableHead>{dict.toda.columnContact}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortTodas(todas, sort).map((toda) => (
          <TableRow key={toda.id}>
            <TableCell className="font-semibold whitespace-normal">{toda.name}</TableCell>
            <TableCell className="whitespace-normal">
              {toda.terminalDescription}
              {toda.connectedTerminals.length > 0 && (
                <span className="block text-xs text-muted-foreground">
                  {dict.toda.connectedTerminals}{" "}
                  {toda.connectedTerminals
                    .map((terminal) => `${terminal.terminalDescription} (${terminal.barangay})`)
                    .join("; ")}
                </span>
              )}
            </TableCell>
            <TableCell>{toda.barangay}</TableCell>
            <TableCell className="whitespace-normal">{toda.barangaysServed.join(", ")}</TableCell>
            <TableCell>
              {toda.officialContact ? (
                <ContactLink contact={toda.officialContact} />
              ) : (
                <span className="text-muted-foreground">{dict.toda.noContact}</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type SortableHeadProps = {
  label: string;
  sortKey: TodaSortKey;
  sort: TodaSort;
  onSort: (key: TodaSortKey) => void;
};

/** A column header whose button sorts by it; aria-sort tells screen readers the order. */
function SortableHead({ label, sortKey, sort, onSort }: SortableHeadProps) {
  const active = sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.direction === "ascending" ? ArrowUp : ArrowDown;
  return (
    <TableHead aria-sort={active ? sort.direction : "none"}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="-mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {label}
        <Icon aria-hidden="true" className={active ? "size-4" : "size-4 text-muted-foreground"} />
      </button>
    </TableHead>
  );
}
