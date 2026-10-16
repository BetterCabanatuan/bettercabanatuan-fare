"use client";

import { useId, useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";

import { JeepFareSteps } from "@/components/fare/jeep-fare-steps";
import { JeepFareTable } from "@/components/fare/jeep-fare-table";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FareSourceInfo, JeepPreviousRates } from "@/lib/data";
import { formatPeso, jeepFare, type JeepFareRules, type JeepType } from "@/lib/fare";
import { formatDate } from "@/lib/format-date";
import { fill } from "@/lib/i18n/locales";

const MIN_KM = 1;
const MAX_KM = 60;

const JEEP_TYPES: JeepType[] = ["traditional", "modern"];

const clampKm = (value: number): number => Math.min(MAX_KM, Math.max(MIN_KM, Math.round(value)));

type JeepFareCalculatorProps = {
  rules: JeepFareRules;
  previousRates: JeepPreviousRates;
  source: FareSourceInfo;
};

/** Distance calculator plus the fare table and explanation that follow its jeep type and km. */
export function JeepFareCalculator({ rules, previousRates, source }: JeepFareCalculatorProps) {
  const { dict } = useDictionary();
  const [type, setType] = useState<JeepType>("traditional");
  const [km, setKm] = useState(5);
  const ids = useId();
  const headingId = `${ids}-heading`;
  const typeLabelId = `${ids}-type`;
  const kmLabelId = `${ids}-km`;

  const rule = rules.types[type];
  const fare = jeepFare(rules, type, km);

  return (
    <>
      <section aria-labelledby={headingId} className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
        <h2 id={headingId} className="text-base font-bold tracking-tight">
          {dict.jeep.computeByDistance}
        </h2>

        <div className="flex flex-col gap-2">
          <span id={typeLabelId} className="text-sm font-medium">
            {dict.jeep.jeepType}
          </span>
          <ToggleGroup
            aria-labelledby={typeLabelId}
            variant="outline"
            spacing={0}
            className="w-full"
            value={[type]}
            onValueChange={(value) => {
              const next = JEEP_TYPES.find((jeepType) => jeepType === value[0]);
              // Ignore the deselect that toggling the active item would cause.
              if (next) setType(next);
            }}
          >
            {JEEP_TYPES.map((jeepType) => (
              <ToggleGroupItem
                key={jeepType}
                value={jeepType}
                className="h-11 flex-1 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {dict.jeep[jeepType]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-2">
          <span id={kmLabelId} className="text-sm font-medium">
            {dict.jeep.distance}
          </span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="size-11"
              aria-label={dict.jeep.decreaseKm}
              disabled={km <= MIN_KM}
              onClick={() => setKm(clampKm(km - 1))}
            >
              <MinusIcon />
            </Button>
            <output aria-labelledby={kmLabelId} className="min-w-16 text-center text-lg font-semibold tabular-nums">
              {km} km
            </output>
            <Button
              variant="outline"
              size="icon"
              className="size-11"
              aria-label={dict.jeep.increaseKm}
              disabled={km >= MAX_KM}
              onClick={() => setKm(clampKm(km + 1))}
            >
              <PlusIcon />
            </Button>
          </div>
          <Slider
            aria-labelledby={kmLabelId}
            min={MIN_KM}
            max={MAX_KM}
            step={1}
            value={[km]}
            onValueChange={(value) => setKm(clampKm(typeof value === "number" ? value : value[0]))}
            className="[&>div]:min-h-11"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-xl bg-foreground p-4 text-background">
          <div className="flex flex-col gap-1">
            <span className="text-xs opacity-80">{dict.jeep.regular}</span>
            <span className="text-3xl font-bold text-highlight tabular-nums">{formatPeso(fare.regular)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs opacity-80">{dict.jeep.discountedRiders}</span>
            <span className="text-3xl font-bold tabular-nums">{formatPeso(fare.discounted)}</span>
          </div>
        </div>

        <dl className="flex flex-col gap-1 text-sm tabular-nums">
          <div className="flex justify-between gap-4">
            <dt>{fill(dict.jeep.firstKm, { km: rule.baseKm, type: dict.jeep[type] })}</dt>
            <dd>{formatPeso(rule.baseFare)}</dd>
          </div>
          {fare.extraKm > 0 && (
            <div className="flex justify-between gap-4">
              <dt>{fill(dict.jeep.moreKm, { count: fare.extraKm, rate: formatPeso(rule.perSucceedingKm) })}</dt>
              <dd>{formatPeso(fare.regular - rule.baseFare)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 text-muted-foreground">
            <dt>{fill(dict.jeep.discount, { percent: Math.round(rules.discountRate * 100) })}</dt>
            <dd>−{formatPeso(fare.regular - fare.discounted)}</dd>
          </div>
        </dl>

        <JeepFareBasis rules={rules} source={source} />
      </section>

      <JeepFareTable rules={rules} type={type} km={km} onSelectKm={(next) => setKm(clampKm(next))} />

      <JeepFareSteps rules={rules} previousRates={previousRates} type={type} />
    </>
  );
}

export function JeepFareBasis({ rules, source }: { rules: JeepFareRules; source: FareSourceInfo }) {
  const { dict } = useDictionary();

  return (
    <p className="text-xs text-muted-foreground">
      {fill(dict.jeep.basis, { effective: formatDate(rules.effectiveDate), date: formatDate(source.lastChecked) })}
    </p>
  );
}
