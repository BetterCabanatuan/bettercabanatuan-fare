"use client";

import { useId } from "react";
import { Info } from "lucide-react";

import { useDictionary } from "@/components/shared/dictionary-provider";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPeso, type TricycleFare, type TricycleFareRules } from "@/lib/fare";
import { fill } from "@/lib/i18n/locales";

type TricycleFareMatrixProps = {
  rules: TricycleFareRules;
  confirmed: boolean;
  basis: string;
  /** The row that the current passenger count uses, highlighted so riders can find it. */
  activeRate: TricycleFare["rate"];
};

export function TricycleFareMatrix({ rules, confirmed, basis, activeRate }: TricycleFareMatrixProps) {
  const { dict } = useDictionary();
  const t = dict.tricycle;
  const titleId = useId();

  const rows = [
    { rate: "solo", label: t.matrixSolo },
    { rate: "shared", label: t.matrixShared },
  ] as const;

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-2xl border bg-card p-4 text-card-foreground"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={titleId} className="text-base font-bold tracking-tight">
          {t.matrixTitle}
        </h3>
        {!confirmed && (
          <Badge variant="outline" className="border-warning-border bg-warning text-warning-foreground">
            {t.unconfirmedBadge}
          </Badge>
        )}
      </div>

      <Table aria-labelledby={titleId} className="text-sm">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="px-2 text-muted-foreground">
              {fill(t.matrixFirstKm, { km: rules.baseKm })}
            </TableHead>
            <TableHead scope="col" className="px-2 text-right">
              {t.regular}
            </TableHead>
            <TableHead scope="col" className="px-2 text-right">
              {t.discounted}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ rate, label }) => {
            const active = rate === activeRate;
            return (
              <TableRow
                key={rate}
                className={active ? "bg-highlight/25 hover:bg-highlight/25" : "hover:bg-transparent"}
              >
                <TableHead scope="row" className="h-auto px-2 py-2.5 font-medium whitespace-normal">
                  <span className="flex flex-col items-start gap-1">
                    {label}
                    {active && (
                      <Badge className="bg-highlight text-highlight-foreground">{t.matrixYourRate}</Badge>
                    )}
                  </span>
                </TableHead>
                <TableCell className="px-2 text-right text-base font-semibold tabular-nums">
                  {formatPeso(rules.regular[rate])}
                </TableCell>
                <TableCell className="px-2 text-right text-base font-semibold tabular-nums">
                  {formatPeso(rules.discounted[rate])}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <p className="text-sm font-medium tabular-nums">
        {fill(t.matrixPerKm, {
          solo: formatPeso(rules.perSucceedingKm.solo),
          shared: formatPeso(rules.perSucceedingKm.shared),
          baseKm: rules.baseKm,
        })}
      </p>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        {t.specialTrip}
      </p>
      <p className="border-t pt-3 text-xs text-muted-foreground">{basis}</p>
    </section>
  );
}
