"use client";

import { useId, useState, type ReactNode } from "react";
import { Info, Maximize2, Minus, Plus, TriangleAlert } from "lucide-react";

import type { RouteStatus } from "@/components/fare/types";
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
import {
  displayKm,
  formatPeso,
  tricycleFare,
  type Passengers,
  type TricycleFareRules,
} from "@/lib/fare";

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
};

type Distance = { km: number; enteredByUser: boolean };

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  // Source dates are plain ISO dates; formatting in UTC stops them shifting a day.
  timeZone: "UTC",
});

// en-PH orders the parts "Oct 16, 2026"; riders expect "16 Oct 2026".
function formatDate(isoDate: string): string {
  const parts = dateFormat.formatToParts(new Date(isoDate));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("day")} ${part("month")} ${part("year")}`;
}

function basisLine(source: FareSourceInfo): string {
  const reference = source.reference ? `, ordinance no. ${source.reference}` : "";
  return `Based on the ${source.label}${reference}. Last checked ${formatDate(source.lastChecked)}.`;
}

const kmLabel = (km: number): string => `${displayKm(km).toFixed(1)} km`;

function passengerSummary({ regular, discounted }: Passengers): string {
  const parts = [
    regular > 0 ? `${regular} regular` : null,
    discounted > 0 ? `${discounted} discounted` : null,
  ].filter((part) => part !== null);
  return parts.join(" + ");
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
}: TricyclePanelProps) {
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

  const roadRoute = hasBothPoints && route.state === "ready" ? route.route : null;
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
  const resultLabel = outsideCity ? "Estimate only — special trip likely" : "Tricycle fare";
  const rateLabel = fare?.rate === "solo" ? "Solo rate" : "Shared rate";
  const distanceLine = distance && fare
    ? `${kmLabel(distance.km)}${distance.enteredByUser ? "" : " road"} · billed ${fare.billableKm} km`
    : "";
  const basis = basisLine(source);

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-base font-medium">Passengers</legend>
        <PassengerCounter
          label="Regular"
          noun="regular passenger"
          value={passengers.regular}
          canDecrement={passengers.regular > 0 && !atMin}
          canIncrement={!atMax}
          onChange={(regular) => setPassengers({ ...passengers, regular })}
        />
        <PassengerCounter
          label="Discounted"
          description="Student, senior, PWD"
          noun="discounted passenger"
          value={passengers.discounted}
          canDecrement={passengers.discounted > 0 && !atMin}
          canIncrement={!atMax}
          onChange={(discounted) => setPassengers({ ...passengers, discounted })}
        />
        <p className="text-sm text-muted-foreground">
          {atMax
            ? `Up to ${MAX_PASSENGERS} passengers per tricycle. `
            : ""}
          Discounted riders should show a valid ID.
        </p>
      </fieldset>

      {!source.confirmed && (
        // A static disclaimer, so "note" rather than the Alert's default "alert" role.
        <Alert role="note" className="border-warning-border bg-warning text-warning-foreground">
          <TriangleAlert aria-hidden />
          <AlertTitle>Not yet confirmed with the city</AlertTitle>
          <AlertDescription className="text-warning-foreground">
            These rates are the November 2018 fare matrix as reported in a 2025 study. A 2026
            fare ordinance is still in draft.
          </AlertDescription>
        </Alert>
      )}

      <div aria-live="polite" className="flex flex-col gap-3">
        {measuring && (
          <p className="flex items-center gap-2 text-sm">
            <Spinner aria-hidden role="presentation" />
            Measuring route…
          </p>
        )}
        {routeError === "no-route" && (
          <p className="text-sm">
            We couldn&apos;t find a road route between these points. Try moving a pin closer to a
            road.
          </p>
        )}
        {routeError === "unreachable" && (
          <p className="text-sm">Can&apos;t measure the route right now. Enter the distance instead.</p>
        )}
        {idle && !distance && (
          <p className="text-sm">
            Tap the map or search to set where you start and where you&apos;re going.
          </p>
        )}
        {outsideCity && (
          <Notice>This point is outside Cabanatuan City. City tricycle fares may not apply.</Notice>
        )}
        {roadRoute?.nationalRoad && (
          <Notice>
            This route uses {roadRoute.nationalRoad}, where tricycles may be restricted.
          </Notice>
        )}
        {distance && distance.km > LONG_TRIP_KM && (
          <Notice>Long trips are usually special trips. Agree on the fare before riding.</Notice>
        )}
        {distance && distance.km < VERY_CLOSE_KM && (
          <Notice>Your start and end points are very close.</Notice>
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
          Type the distance instead
        </Button>
      )}

      {showManual && (
        <Field id={manualRegionId} data-invalid={manualInvalid || undefined}>
          <FieldLabel htmlFor={kmInputId}>Distance in km</FieldLabel>
          <Input
            id={kmInputId}
            type="number"
            inputMode="decimal"
            step={0.1}
            min={MIN_MANUAL_KM}
            placeholder="e.g. 4.2"
            value={manualText}
            onChange={(event) => setManualText(event.target.value)}
            aria-invalid={manualInvalid || undefined}
            aria-describedby={kmHintId}
            className="h-11 tabular-nums"
          />
          <FieldDescription id={kmHintId}>
            {manualInvalid
              ? `Enter a distance of at least ${MIN_MANUAL_KM} km.`
              : "Use the road distance, not a straight line."}
          </FieldDescription>
        </Field>
      )}

      {fare && distance && (
        <section
          aria-labelledby={resultTitleId}
          className="flex flex-col gap-4 rounded-xl bg-foreground p-4 text-background"
        >
          <div className="flex flex-col gap-1">
            <h3
              id={resultTitleId}
              className={outsideCity ? "text-sm font-medium text-highlight" : "text-sm font-medium"}
            >
              {resultLabel}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-5xl font-bold tabular-nums text-highlight">
                {formatPeso(fare.total)}
              </p>
              <Badge className="bg-highlight text-highlight-foreground">{rateLabel}</Badge>
            </div>
            <p className="tabular-nums">{distanceLine}</p>
            {distance.enteredByUser ? (
              <p className="text-sm text-background/70">Distance entered by you</p>
            ) : (
              <p className="text-sm text-background/70">
                Fare is based on the route shown. A different road may change the distance.
              </p>
            )}
          </div>

          <dl className="flex flex-col gap-1 border-t border-background/20 pt-3 text-sm">
            {passengers.regular > 0 && (
              <BreakdownRow
                label="Regular"
                calculation={`${passengers.regular} × ${formatPeso(fare.regularEach)}`}
                amount={formatPeso(passengers.regular * fare.regularEach)}
              />
            )}
            {passengers.discounted > 0 && (
              <BreakdownRow
                label="Discounted"
                calculation={`${passengers.discounted} × ${formatPeso(fare.discountedEach)}`}
                amount={formatPeso(passengers.discounted * fare.discountedEach)}
              />
            )}
          </dl>
          {fare.extraKm > 0 && (
            <p className="-mt-2 text-sm text-background/70 tabular-nums">
              Each fare includes {fare.extraKm} km after the first {rules.baseKm} km at{" "}
              {formatPeso(rules.perSucceedingKmPerPassenger)} per km.
            </p>
          )}

          <Dialog>
            <DialogTrigger
              render={
                <Button className="h-12 w-full bg-highlight text-base text-highlight-foreground hover:bg-highlight/90" />
              }
            >
              <Maximize2 aria-hidden />
              Show the driver
            </DialogTrigger>
            <DialogContent
              showCloseButton={false}
              className="flex h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-none flex-col items-center justify-center gap-6 overflow-y-auto bg-foreground p-6 text-center text-background sm:max-w-none"
            >
              <DialogTitle className="text-xl text-background/80">{resultLabel}</DialogTitle>
              <p className="text-7xl font-bold tabular-nums text-highlight sm:text-9xl">
                {formatPeso(fare.total)}
              </p>
              <p className="text-2xl tabular-nums">{distanceLine}</p>
              <p className="text-xl">
                {passengerSummary(passengers)} · {rateLabel}
              </p>
              <DialogDescription className="max-w-xl text-base text-background/80">
                {basis}
                {source.confirmed ? "" : " Not yet confirmed with the city."}
              </DialogDescription>
              <DialogClose
                render={
                  <Button className="h-12 min-w-40 bg-background text-base text-foreground hover:bg-background/90" />
                }
              >
                Close
              </DialogClose>
            </DialogContent>
          </Dialog>
        </section>
      )}

      {fare && <p className="text-sm text-muted-foreground">{basis}</p>}
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info aria-hidden className="size-4 shrink-0" />
        Special trip (arkila) rate not yet published.
      </p>
    </div>
  );
}

type PassengerCounterProps = {
  label: string;
  description?: string;
  /** Used in the button labels, e.g. "Add a regular passenger". */
  noun: string;
  value: number;
  canDecrement: boolean;
  canIncrement: boolean;
  onChange: (value: number) => void;
};

function PassengerCounter({
  label,
  description,
  noun,
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
          aria-label={`Remove a ${noun}`}
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
          aria-label={`Add a ${noun}`}
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
