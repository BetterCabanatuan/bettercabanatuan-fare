"use client";

import { useId, useState, type ReactNode } from "react";
import { Maximize2, Minus, Plus, TriangleAlert } from "lucide-react";

import { RoadOptions } from "@/components/fare/road-options";
import { TricycleFareHistory } from "@/components/fare/tricycle-fare-history";
import { TricycleFareMatrix } from "@/components/fare/tricycle-fare-matrix";
import type { RouteStatus } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { FareSourceInfo } from "@/lib/data";
import { formatDate } from "@/lib/format-date";
import {
  displayKm,
  formatPeso,
  tricycleFare,
  type Passengers,
  type TricycleFare,
  type TricycleFareRules,
} from "@/lib/fare";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { fill } from "@/lib/i18n/locales";

// City limit not yet confirmed (spec §10, open item 8).
const MAX_PASSENGERS = 6;
// Threshold to confirm with the city (spec §8 leaves it as a FILL).
const LONG_TRIP_KM = 15;
// Spec §8: points under 100 m apart count as "very close".
const VERY_CLOSE_KM = 0.1;
const MIN_MANUAL_KM = 0.1;

type TricyclePanelProps = {
  rules: TricycleFareRules;
  source: FareSourceInfo;
  route: RouteStatus;
  hasBothPoints: boolean;
  outsideCity: boolean;
  onSelectRoad: (index: number) => void;
};

type Distance = { km: number; enteredByUser: boolean };

type TricycleText = Dictionary["tricycle"];

function basisLine(source: FareSourceInfo, t: TricycleText): string {
  return fill(t.basis, {
    label: source.label,
    reference: source.reference ? fill(t.reference, { reference: source.reference }) : "",
    date: formatDate(source.lastChecked),
  });
}

function distanceLine(distance: Distance, billableKm: number, t: TricycleText): string {
  const km = displayKm(distance.km).toFixed(1);
  const shown = fill(distance.enteredByUser ? t.enteredKm : t.roadKm, { km });
  return [shown, fill(t.billedKm, { km: billableKm })].join(" · ");
}

function passengerSummary({ regular, discounted }: Passengers, t: TricycleText): string {
  const parts = [
    regular > 0 ? fill(t.regularCount, { count: regular }) : null,
    discounted > 0 ? fill(t.discountedCount, { count: discounted }) : null,
  ].filter((part) => part !== null);
  return parts.join(" + ");
}

function perPassengerLines(
  fare: TricycleFare,
  { regular, discounted }: Passengers,
  t: TricycleText,
): string[] {
  return [
    regular > 0 ? fill(t.perRegular, { amount: formatPeso(fare.regularEach) }) : null,
    discounted > 0 ? fill(t.perDiscounted, { amount: formatPeso(fare.discountedEach) }) : null,
  ].filter((line) => line !== null);
}

function parseKm(text: string): number | null {
  const km = Number(text);
  return text.trim() !== "" && Number.isFinite(km) && km >= MIN_MANUAL_KM ? km : null;
}

export function TricyclePanel({
  rules,
  source,
  route,
  hasBothPoints,
  outsideCity,
  onSelectRoad,
}: TricyclePanelProps) {
  const { dict } = useDictionary();
  const t = dict.tricycle;
  const [passengers, setPassengers] = useState<Passengers>({ regular: 1, discounted: 0 });
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState("");
  const kmInputId = useId();
  const kmHintId = useId();
  const manualRegionId = useId();
  const resultTitleId = useId();

  const totalPassengers = passengers.regular + passengers.discounted;
  const atMax = totalPassengers >= MAX_PASSENGERS;
  const atMin = totalPassengers <= 1;

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

  const fare = distance ? tricycleFare(rules, distance.km, passengers) : null;
  const resultLabel = outsideCity ? t.estimateOnly : t.resultTitle;
  const rateLabel = fare?.rate === "solo" ? t.soloRate : t.sharedRate;
  const distanceText = distance && fare ? distanceLine(distance, fare.billableKm, t) : "";
  const basis = basisLine(source, t);
  const activeRate = totalPassengers === 1 ? "solo" : "shared";
  const perPassenger = fare ? perPassengerLines(fare, passengers, t) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border bg-card p-4 text-card-foreground">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-base font-bold tracking-tight">{t.passengers}</legend>
          <PassengerCounter
            label={t.regular}
            addLabel={t.addRegular}
            removeLabel={t.removeRegular}
            value={passengers.regular}
            canDecrement={passengers.regular > 0 && !atMin}
            canIncrement={!atMax}
            onChange={(regular) => setPassengers({ ...passengers, regular })}
          />
          <PassengerCounter
            label={t.discounted}
            description={t.discountedWho}
            addLabel={t.addDiscounted}
            removeLabel={t.removeDiscounted}
            value={passengers.discounted}
            canDecrement={passengers.discounted > 0 && !atMin}
            canIncrement={!atMax}
            onChange={(discounted) => setPassengers({ ...passengers, discounted })}
          />
          <p className="text-sm text-muted-foreground">
            {atMax ? `${fill(t.maxPassengers, { max: MAX_PASSENGERS })} ` : ""}
            {t.showId}
          </p>
        </fieldset>
      </div>

      {!source.confirmed && (
        // A static disclaimer, so "note" rather than the Alert's default "alert" role.
        <Alert role="note" className="border-warning-border bg-warning text-warning-foreground">
          <TriangleAlert aria-hidden />
          <AlertTitle>{t.unconfirmedTitle}</AlertTitle>
          <AlertDescription className="text-warning-foreground">
            {t.unconfirmedBody}
          </AlertDescription>
        </Alert>
      )}

      <div aria-live="polite" className="flex flex-col gap-3">
        {measuring && (
          <p className="flex items-center gap-2 text-sm">
            <Spinner aria-hidden role="presentation" />
            {t.measuring}
          </p>
        )}
        {routeError === "no-route" && (
          <p className="text-sm">{t.noRoute}</p>
        )}
        {routeError === "unreachable" && (
          <p className="text-sm">{t.unreachable}</p>
        )}
        {idle && !distance && (
          <p className="text-sm">{t.idle}</p>
        )}
        {outsideCity && (
          <Notice>{t.outsideCity}</Notice>
        )}
        {roadRoute?.nationalRoad && (
          <Notice>{fill(t.nationalRoad, { road: roadRoute.nationalRoad })}</Notice>
        )}
        {distance && distance.km > LONG_TRIP_KM && (
          <Notice>{t.longTrip}</Notice>
        )}
        {distance && distance.km < VERY_CLOSE_KM && (
          <Notice>{t.veryClose}</Notice>
        )}
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
          fareFor={(km) => tricycleFare(rules, km, passengers).total}
        />
      )}

      {fare && distance && (
        <section
          aria-labelledby={resultTitleId}
          className="flex flex-col gap-4 rounded-2xl bg-foreground p-5 text-background"
        >
          <div className="flex flex-col gap-2">
            <h3
              id={resultTitleId}
              className={
                outsideCity
                  ? "text-sm font-semibold text-highlight"
                  : "text-sm font-semibold text-background/80"
              }
            >
              {resultLabel}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-5xl leading-none font-bold tracking-tight tabular-nums text-highlight">
                {formatPeso(fare.total)}
              </p>
              <Badge className="bg-highlight text-highlight-foreground">{rateLabel}</Badge>
            </div>
            <ul className="flex flex-col text-base font-semibold tabular-nums">
              {perPassenger.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium tabular-nums">{distanceText}</p>
            <p className="text-sm text-background/70">
              {distance.enteredByUser ? t.enteredByYou : t.routeNote}
            </p>
          </div>

          <div className="flex flex-col gap-1 border-t border-background/20 pt-3">
            <dl className="flex flex-col gap-1 text-sm">
              {passengers.regular > 0 && (
                <BreakdownRow
                  label={t.regular}
                  calculation={`${passengers.regular} × ${formatPeso(fare.regularEach)}`}
                  amount={formatPeso(passengers.regular * fare.regularEach)}
                />
              )}
              {passengers.discounted > 0 && (
                <BreakdownRow
                  label={t.discounted}
                  calculation={`${passengers.discounted} × ${formatPeso(fare.discountedEach)}`}
                  amount={formatPeso(passengers.discounted * fare.discountedEach)}
                />
              )}
            </dl>
            {fare.extraKm > 0 && (
              <p className="text-sm text-background/70 tabular-nums">
                {fill(t.extraKm, {
                  extra: fare.extraKm,
                  base: rules.baseKm,
                  rate: formatPeso(rules.perSucceedingKm[fare.rate]),
                })}
              </p>
            )}
          </div>

          <Dialog>
            <DialogTrigger
              render={
                <Button className="h-12 w-full bg-highlight text-base font-semibold text-highlight-foreground hover:bg-highlight/90" />
              }
            >
              <Maximize2 aria-hidden />
              {t.showDriver}
            </DialogTrigger>
            <DialogContent
              showCloseButton={false}
              className="flex h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-none flex-col items-center justify-center gap-6 overflow-y-auto bg-foreground p-6 text-center text-background sm:max-w-none"
            >
              <DialogTitle className="text-xl text-background/80">{resultLabel}</DialogTitle>
              <p className="text-7xl font-bold tabular-nums text-highlight sm:text-9xl">
                {formatPeso(fare.total)}
              </p>
              <ul className="flex flex-col gap-1 text-2xl font-semibold tabular-nums">
                {perPassenger.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="text-2xl tabular-nums">{distanceText}</p>
              <p className="text-xl">
                {passengerSummary(passengers, t)} · {rateLabel}
              </p>
              <DialogDescription className="max-w-xl text-base text-background/80">
                {basis}
                {source.confirmed ? "" : ` ${t.notConfirmed}`}
              </DialogDescription>
              <DialogClose
                render={
                  <Button className="h-12 min-w-40 bg-background text-base text-foreground hover:bg-background/90" />
                }
              >
                {t.close}
              </DialogClose>
            </DialogContent>
          </Dialog>
        </section>
      )}

      <TricycleFareMatrix
        rules={rules}
        confirmed={source.confirmed}
        basis={basis}
        activeRate={activeRate}
      />
      <TricycleFareHistory />
    </div>
  );
}

type PassengerCounterProps = {
  label: string;
  description?: string;
  addLabel: string;
  removeLabel: string;
  value: number;
  canDecrement: boolean;
  canIncrement: boolean;
  onChange: (value: number) => void;
};

function PassengerCounter({
  label,
  description,
  addLabel,
  removeLabel,
  value,
  canDecrement,
  canIncrement,
  onChange,
}: PassengerCounterProps) {
  const labelId = useId();

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p id={labelId} className="font-medium">
          {label}
        </p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div role="group" aria-labelledby={labelId} className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-11"
          aria-label={removeLabel}
          disabled={!canDecrement}
          // Keeps keyboard focus in place when the button hits a limit.
          focusableWhenDisabled
          onClick={() => onChange(value - 1)}
        >
          <Minus aria-hidden />
        </Button>
        <output aria-live="polite" className="w-8 text-center text-lg font-semibold tabular-nums">
          {value}
        </output>
        <Button
          variant="outline"
          size="icon"
          className="size-11"
          aria-label={addLabel}
          disabled={!canIncrement}
          focusableWhenDisabled
          onClick={() => onChange(value + 1)}
        >
          <Plus aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2 rounded-lg border border-warning-border bg-warning px-3 py-2 text-sm text-warning-foreground">
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function BreakdownRow({
  label,
  calculation,
  amount,
}: {
  label: string;
  calculation: string;
  amount: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt>{label}</dt>
      <dd className="tabular-nums">
        <span className="text-background/70">{calculation} = </span>
        {amount}
      </dd>
    </div>
  );
}
