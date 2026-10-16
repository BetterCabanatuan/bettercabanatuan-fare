"use client";

import { useId } from "react";

import { useDictionary } from "@/components/shared/dictionary-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPeso, jeepFare, type JeepFareRules, type JeepType } from "@/lib/fare";
import { fill } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

// Common trip lengths out of Cabanatuan, from a short hop to the farther towns.
const TABLE_KM = [4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40];

type JeepFareTableProps = {
  rules: JeepFareRules;
  type: JeepType;
  km: number;
  onSelectKm: (km: number) => void;
};

export function JeepFareTable({ rules, type, km, onSelectKm }: JeepFareTableProps) {
  const { dict } = useDictionary();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-base font-bold tracking-tight">
          {fill(dict.jeep.fareTable, { type: dict.jeep[type] })}
        </h2>
        <p className="text-xs text-muted-foreground">{dict.jeep.fareTableHint}</p>
      </div>

      <Table aria-labelledby={headingId} className="tabular-nums">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="text-xs text-muted-foreground">
              {dict.jeep.distance}
            </TableHead>
            <TableHead scope="col" className="text-right text-xs text-muted-foreground">
              {dict.jeep.regular}
            </TableHead>
            <TableHead scope="col" className="text-right text-xs text-muted-foreground">
              {dict.jeep.discounted}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {TABLE_KM.map((rowKm) => {
            const fare = jeepFare(rules, type, rowKm);
            const selected = rowKm === km;
            return (
              <TableRow
                key={rowKm}
                // The button's ::after covers the row, so the whole row is the tap target.
                className={cn("relative", selected && "bg-highlight/30 font-semibold hover:bg-highlight/30")}
              >
                <TableHead scope="row" className={cn("h-11 p-0", selected ? "font-semibold" : "font-medium")}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    aria-label={fill(dict.jeep.useDistance, { km: rowKm })}
                    onClick={() => onSelectKm(rowKm)}
                    className="flex h-11 w-full cursor-pointer items-center px-2 text-left outline-none after:absolute after:inset-0 after:rounded-md focus-visible:after:ring-3 focus-visible:after:ring-ring/50 focus-visible:after:ring-inset"
                  >
                    {rowKm} km
                  </button>
                </TableHead>
                <TableCell className="text-right">{formatPeso(fare.regular)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatPeso(fare.discounted)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
