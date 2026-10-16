"use client";

import { useId } from "react";

import { useDictionary } from "@/components/shared/dictionary-provider";
import { Badge } from "@/components/ui/badge";
import type { JeepPreviousRates } from "@/lib/data";
import { formatPeso, type JeepFareRules, type JeepType } from "@/lib/fare";
import { formatDate } from "@/lib/format-date";
import { fill } from "@/lib/i18n/locales";

type JeepFareStepsProps = {
  rules: JeepFareRules;
  previousRates: JeepPreviousRates;
  type: JeepType;
};

export function JeepFareSteps({ rules, previousRates, type }: JeepFareStepsProps) {
  const { dict } = useDictionary();
  const headingId = useId();
  const rule = rules.types[type];
  const previous = previousRates[type];

  const steps = [
    fill(dict.jeep.stepBase, { km: rule.baseKm, fare: formatPeso(rule.baseFare) }),
    fill(dict.jeep.stepPerKm, { rate: formatPeso(rule.perSucceedingKm) }),
    fill(dict.jeep.stepDiscount, { percent: Math.round(rules.discountRate * 100) }),
  ];

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className="text-base font-bold tracking-tight">
          {dict.jeep.howComputed}
        </h2>
        <Badge variant="secondary">{dict.jeep[type]}</Badge>
      </div>

      <ol className="flex flex-col gap-2.5 text-sm tabular-nums">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
            >
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <p className="border-t pt-3 text-xs text-muted-foreground tabular-nums">
        {fill(dict.jeep.previousRates, {
          date: formatDate(rules.effectiveDate),
          base: formatPeso(previous.baseFare),
          rate: formatPeso(previous.perSucceedingKm),
        })}
      </p>
    </section>
  );
}
