"use client";

import { useId, type ReactNode } from "react";
import { Maximize2, Minus, Plus, TriangleAlert } from "lucide-react";

import { bandRange, FuelBandSelect } from "@/components/fare/fuel-band-select";
import { RoadOptions } from "@/components/fare/road-options";
import { TricycleFareHistory } from "@/components/fare/tricycle-fare-history";
import { TricycleFareMatrix } from "@/components/fare/tricycle-fare-matrix";
import type { RouteStatus, TricycleOptions } from "@/components/fare/types";
import { FareFeedbackPrompt } from "@/components/feedback/fare-feedback-prompt";
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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import type { FareSourceInfo } from "@/lib/data";
import { formatDate } from "@/lib/format-date";
import {
  canRequestSpecialTrip,
  displayKm,
  formatPeso,
  tricycleFare,
  withFuelBand,
  type Passengers,
  type TricycleFare,
  type TricycleFareRules,
} from "@/lib/fare";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { fill } from "@/lib/i18n/locales";

// Threshold to confirm with the city (spec §8 leaves it as a FILL).
const LONG_TRIP_KM = 15;
// Spec §8: points under 100 m apart count as "very close".
const VERY_CLOSE_KM = 0.1;

type TricyclePanelProps = {
  rules: TricycleFareRules;
  source: FareSourceInfo;
  route: RouteStatus;
  hasBothPoints: boolean;
  outsideCity: boolean;
  onSelectRoad: (index: number) => void;
  feedbackHref: string;
  complaints: ReactNode;
  options: TricycleOptions;
  onOptionsChange: (options: TricycleOptions) => void;
};

type TricycleText = Dictionary["tricycle"];

function basisLine(source: FareSourceInfo, t: TricycleText): string {
  return fill(t.basis, {
    label: source.label,
    reference: source.reference ? fill(t.reference, { reference: source.reference }) : "",
    date: formatDate(source.lastChecked),
  });
}

function distanceLine(distanceKm: number, billableKm: number, t: TricycleText): string {
  const shown = fill(t.roadKm, { km: displayKm(distanceKm).toFixed(1) });
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

export function TricyclePanel({
  rules,
  source,
  route,
  hasBothPoints,
  outsideCity,
  onSelectRoad,
  feedbackHref,
  complaints,
  options,
  onOptionsChange,
}: TricyclePanelProps) {
  const { dict } = useDictionary();
  const t = dict.tricycle;
  const { passengers, specialTripRequested, fuelBandIndex } = options;
  const setPassengers = (next: Passengers) => onOptionsChange({ ...options, passengers: next });
  const resultTitleId = useId();

  const fuelBand = rules.fuelBands[fuelBandIndex];
  const bandRules = withFuelBand(rules, fuelBand);
  const raisedRate = fuelBandIndex > 0;
  const bandApplied = raisedRate ? fill(t.fuelBand.applied, bandRange(fuelBand)) : null;

  const totalPassengers = passengers.regular + passengers.discounted;
  const atMax = totalPassengers >= rules.maxPassengers;
  const atMin = totalPassengers <= 1;
  const soloRider = canRequestSpecialTrip(passengers);
  const specialTrip = specialTripRequested && soloRider;

  const roadRoute = hasBothPoints && route.state === "ready" ? route.routes[route.selected] : null;
  const routeError = hasBothPoints && route.state === "error" ? route.reason : null;
  const measuring = hasBothPoints && route.state === "loading";
  const idle = !roadRoute && !routeError && !measuring;
  const distanceKm = roadRoute?.distanceKm ?? null;

  const fare = distanceKm !== null ? tricycleFare(bandRules, distanceKm, passengers, specialTrip) : null;
  const resultLabel = outsideCity ? t.estimateOnly : t.resultTitle;
  const distanceText = distanceKm !== null && fare ? distanceLine(distanceKm, fare.billableKm, t) : "";
  const basis = basisLine(source, t);
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
            {atMax ? `${fill(t.maxPassengers, { max: rules.maxPassengers })} ` : ""}
            {t.showId}
          </p>
        </fieldset>
        <div className="mt-4 flex flex-col gap-1 border-t pt-4">
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 font-medium has-data-disabled:cursor-not-allowed">
            {t.specialTripToggle}
            <Switch
              checked={specialTrip}
              disabled={!soloRider}
              onCheckedChange={(checked) => onOptionsChange({ ...options, specialTripRequested: checked })}
            />
          </label>
          <p className="text-sm text-muted-foreground">
            {soloRider
              ? fill(t.specialTripHint, { times: rules.specialTripMultiplier })
              : t.specialTripSoloOnly}
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t pt-4">
          <FuelBandSelect
            bands={rules.fuelBands}
            value={fuelBandIndex}
            onChange={(index) => onOptionsChange({ ...options, fuelBandIndex: index })}
          />
          {raisedRate && <Notice>{t.fuelBand.warning}</Notice>}
        </div>
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
        {idle && (
          <p className="text-sm">{t.idle}</p>
        )}
        {outsideCity && (
          <Notice>{t.outsideCity}</Notice>
        )}
        {roadRoute?.nationalRoad && (
          <Notice>{fill(t.nationalRoad, { road: roadRoute.nationalRoad })}</Notice>
        )}
        {distanceKm !== null && distanceKm > LONG_TRIP_KM && (
          <Notice>{t.longTrip}</Notice>
        )}
        {distanceKm !== null && distanceKm < VERY_CLOSE_KM && (
          <Notice>{t.veryClose}</Notice>
        )}
      </div>

      {hasBothPoints && route.state === "ready" && route.routes.length > 1 && (
        <RoadOptions
          roads={route.routes}
          selected={route.selected}
          onSelect={onSelectRoad}
          fareFor={(km) => tricycleFare(bandRules, km, passengers, specialTrip).total}
        />
      )}

      {fare && (
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
              {fare.specialTrip && (
                <Badge className="bg-highlight text-highlight-foreground">{t.specialTripBadge}</Badge>
              )}
            </div>
            <ul className="flex flex-col text-base font-semibold tabular-nums">
              {perPassenger.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium tabular-nums">{distanceText}</p>
            {bandApplied && <p className="text-sm font-semibold text-highlight">{bandApplied}</p>}
            <p className="text-sm text-background/70">{t.routeNote}</p>
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
                  base: bandRules.baseKm,
                  regular: formatPeso(bandRules.perSucceedingKm.regular),
                  discounted: formatPeso(bandRules.perSucceedingKm.discounted),
                })}
              </p>
            )}
            {fare.specialTrip && (
              <p className="text-sm text-background/70">
                {fill(t.specialTripApplied, { times: rules.specialTripMultiplier })}
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
                {passengerSummary(passengers, t)}
                {fare.specialTrip ? ` · ${t.specialTripBadge}` : ""}
              </p>
              {bandApplied && <p className="text-xl font-semibold text-highlight">{bandApplied}</p>}
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

      <FareFeedbackPrompt href={feedbackHref} />
      {complaints}

      <TricycleFareMatrix rules={bandRules} fuelBand={fuelBand} confirmed={source.confirmed} basis={basis} />
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
