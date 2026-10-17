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
import { formatPeso, type Centavos, type TricycleFareRules } from "@/lib/fare";
import { fill } from "@/lib/i18n/locales";

type TricycleFareMatrixProps = {
  rules: TricycleFareRules;
  confirmed: boolean;
  basis: string;
};

export function TricycleFareMatrix({ rules, confirmed, basis }: TricycleFareMatrixProps) {
  const { dict } = useDictionary();
  const t = dict.tricycle;
  const titleId = useId();
  const { baseFare, perSucceedingKm, specialTripMultiplier } = rules;

  const rows: { key: string; label: string; regular: Centavos; discounted: Centavos }[] = [
    { key: "base", label: fill(t.matrixFirstKm, { km: rules.baseKm }), ...baseFare },
    { key: "perKm", label: t.matrixPerKm, ...perSucceedingKm },
    {
      key: "specialTrip",
      label: fill(t.matrixSpecialTrip, { km: rules.baseKm }),
      regular: baseFare.regular * specialTripMultiplier,
      discounted: baseFare.discounted * specialTripMultiplier,
    },
  ];

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
              {t.matrixPerPassenger}
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
          {rows.map(({ key, label, regular, discounted }) => (
            <TableRow key={key} className="hover:bg-transparent">
              <TableHead scope="row" className="h-auto px-2 py-2.5 font-medium whitespace-normal">
                {label}
              </TableHead>
              <TableCell className="px-2 text-right text-base font-semibold tabular-nums">
                {formatPeso(regular)}
              </TableCell>
              <TableCell className="px-2 text-right text-base font-semibold tabular-nums">
                {formatPeso(discounted)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        {fill(t.specialTrip, { times: specialTripMultiplier })}
      </p>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        {t.fuelPrice}
      </p>
      <p className="border-t pt-3 text-xs text-muted-foreground">{basis}</p>
    </section>
  );
}
