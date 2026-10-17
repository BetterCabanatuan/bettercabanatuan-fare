"use client";

import { useId, useState } from "react";

import { RoadOptions } from "@/components/fare/road-options";
import { JeepFareBasis, JeepFareBreakdown, JeepTypeToggle } from "@/components/fare/jeep-fare-calculator";
import type { RouteStatus } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { FareSourceInfo } from "@/lib/data";
import { displayKm, formatPeso, jeepFare, type JeepFareRules, type JeepType } from "@/lib/fare";
import { fill } from "@/lib/i18n/locales";

const MIN_MANUAL_KM = 0.1;

type Distance = { km: number; enteredByUser: boolean };

function parseKm(text: string): number | null {
  const km = Number(text);
  return text.trim() !== "" && Number.isFinite(km) && km >= MIN_MANUAL_KM ? km : null;
}

type JeepRoadFareProps = {
  rules: JeepFareRules;
  source: FareSourceInfo;
  route: RouteStatus;
  hasBothPoints: boolean;
  onSelectRoad: (index: number) => void;
};

/** Jeep fare from the A→B road distance, with a typed distance when the route can't be measured. */
export function JeepRoadFare({ rules, source, route, hasBothPoints, onSelectRoad }: JeepRoadFareProps) {
  const { dict } = useDictionary();
  const t = dict.jeep;
  const [type, setType] = useState<JeepType>("traditional");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState("");
  const kmInputId = useId();
  const kmHintId = useId();
  const manualRegionId = useId();
  const resultTitleId = useId();

  const roadRoute = hasBothPoints && route.state === "ready" ? route.routes[route.selected] : null;
  const routeError = hasBothPoints && route.state === "error" ? route.reason : null;
  const measuring = hasBothPoints && route.state === "loading";
  const idle = !roadRoute && !routeError && !measuring;
  const showManual = routeError !== null || (idle && manualOpen);

  const manualKm = parseKm(manualText);
  const manualInvalid = manualText.trim() !== "" && manualKm === null;

  const distance: Distance | null = roadRoute
    ? { km: roadRoute.distanceKm, enteredByUser: false }
    : showManual && manualKm !== null
      ? { km: manualKm, enteredByUser: true }
      : null;

  const fare = distance ? jeepFare(rules, type, distance.km) : null;
  const distanceText =
    distance && fare
      ? [
          fill(distance.enteredByUser ? t.enteredKm : t.roadKm, { km: displayKm(distance.km).toFixed(1) }),
          fill(t.billedKm, { km: fare.billableKm }),
        ].join(" · ")
      : "";

  return (
    <div className="flex flex-col gap-3">
      <div aria-live="polite" className="flex flex-col gap-3">
        {measuring && (
          <p className="flex items-center gap-2 text-sm">
            <Spinner aria-hidden role="presentation" />
            {t.measuring}
          </p>
        )}
        {routeError === "no-route" && <p className="text-sm">{t.noRoute}</p>}
        {routeError === "unreachable" && <p className="text-sm">{t.unreachable}</p>}
        {idle && !distance && <p className="text-sm">{t.setPoints}</p>}
      </div>

      {idle && (
        <Button
          variant="link"
          className="h-11 self-start px-0"
          aria-expanded={manualOpen}
          aria-controls={manualRegionId}
          onClick={() => setManualOpen(!manualOpen)}
        >
          {t.typeDistance}
        </Button>
      )}

      {showManual && (
        <Field id={manualRegionId} data-invalid={manualInvalid || undefined}>
          <FieldLabel htmlFor={kmInputId}>{t.distanceLabel}</FieldLabel>
          <Input
            id={kmInputId}
            type="number"
            inputMode="decimal"
            step={0.1}
            min={MIN_MANUAL_KM}
            placeholder={t.distancePlaceholder}
            value={manualText}
            onChange={(event) => setManualText(event.target.value)}
            aria-invalid={manualInvalid || undefined}
            aria-describedby={kmHintId}
            className="h-11 tabular-nums"
          />
          <FieldDescription id={kmHintId}>
            {manualInvalid ? fill(t.distanceTooShort, { min: MIN_MANUAL_KM }) : t.distanceHint}
          </FieldDescription>
        </Field>
      )}

      {hasBothPoints && route.state === "ready" && route.routes.length > 1 && (
        <RoadOptions
          roads={route.routes}
          selected={route.selected}
          onSelect={onSelectRoad}
          fareFor={(km) => jeepFare(rules, type, km).regular}
        />
      )}

      {fare && distance && (
        <section
          aria-labelledby={resultTitleId}
          className="flex flex-col gap-4 rounded-2xl border bg-card p-4 text-card-foreground"
        >
          <h2 id={resultTitleId} className="text-base font-bold tracking-tight">
            {t.tripFareTitle}
          </h2>

          <JeepTypeToggle value={type} onChange={setType} />

          <div className="flex flex-col gap-4 rounded-xl bg-foreground p-4 text-background">
            <dl className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <dt className="text-sm text-background/80">{t.regular}</dt>
                <dd className="text-4xl leading-none font-bold tracking-tight text-highlight tabular-nums">
                  {formatPeso(fare.regular)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-sm text-background/80">{t.discountedRiders}</dt>
                <dd className="text-4xl leading-none font-bold tracking-tight tabular-nums">
                  {formatPeso(fare.discounted)}
                </dd>
              </div>
            </dl>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium tabular-nums">{distanceText}</p>
              <p className="text-sm text-background/70">{distance.enteredByUser ? t.enteredByYou : t.roadNote}</p>
            </div>
          </div>

          <JeepFareBreakdown rules={rules} type={type} fare={fare} />

          <JeepFareBasis rules={rules} source={source} />
        </section>
      )}
    </div>
  );
}
