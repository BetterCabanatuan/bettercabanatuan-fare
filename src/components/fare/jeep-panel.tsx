"use client";

import { useId, useState } from "react";
import { ChevronDownIcon, MinusIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FareSourceInfo } from "@/lib/data";
import { displayKm, formatPeso, jeepFare, type JeepFareRules, type JeepType } from "@/lib/fare";
import { haversineKm, type LngLat } from "@/lib/geo";
import { findTrips, isMapped, type JeepRoute, type JeepTrip } from "@/lib/jeep-routes";

// Walking limit is not yet decided (spec §4.3 FR-9, open item 5); 500 m is the spec's example.
const MAX_WALK_KM = 0.5;
const CLOSE_POINTS_KM = 0.5;
const MIN_KM = 1;
const MAX_KM = 60;

const JEEP_TYPES: JeepType[] = ["traditional", "modern"];
const TYPE_NAMES: Record<JeepType, string> = { traditional: "Traditional", modern: "Modern" };

// Dates are ISO calendar days; formatting in UTC keeps them from shifting a day.
const dateFormat = new Intl.DateTimeFormat("en-PH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const formatDate = (isoDate: string): string => dateFormat.format(new Date(`${isoDate}T00:00:00Z`));

const formatDistance = (km: number): string =>
  km < 1 ? `${Math.round(km * 100) * 10} m` : `${displayKm(km)} km`;

const tripKey = (trip: JeepTrip): string => `${trip.route.id}:${trip.direction.id}`;

const isTodo = (value: string | undefined): boolean => !value || value.startsWith("TODO");

type JeepPanelProps = {
  rules: JeepFareRules;
  source: FareSourceInfo;
  routes: JeepRoute[];
  a?: LngLat;
  b?: LngLat;
  selectedTripKey: string | null;
  onSelectTrip: (trip: JeepTrip | null) => void;
  onUseTricycle: () => void;
};

export function JeepPanel({
  rules,
  source,
  routes,
  a,
  b,
  selectedTripKey,
  onSelectTrip,
  onUseTricycle,
}: JeepPanelProps) {
  const mapped = routes.filter(isMapped);
  const unmapped = routes.filter((route) => !isMapped(route));

  return (
    <div className="flex flex-col gap-6">
      {mapped.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Jeepney routes are still being mapped. Meanwhile, you can compute a jeep fare by distance.
        </p>
      ) : a && b ? (
        <TripResults
          rules={rules}
          source={source}
          routes={mapped}
          a={a}
          b={b}
          selectedTripKey={selectedTripKey}
          onSelectTrip={onSelectTrip}
          onUseTricycle={onUseTricycle}
        />
      ) : (
        <MappedRoutes routes={mapped} />
      )}

      <DistanceCalculator rules={rules} source={source} />

      {unmapped.length > 0 && <UnmappedRoutes routes={unmapped} />}
    </div>
  );
}

function TripResults({
  rules,
  source,
  routes,
  a,
  b,
  selectedTripKey,
  onSelectTrip,
  onUseTricycle,
}: {
  rules: JeepFareRules;
  source: FareSourceInfo;
  routes: JeepRoute[];
  a: LngLat;
  b: LngLat;
  selectedTripKey: string | null;
  onSelectTrip: (trip: JeepTrip | null) => void;
  onUseTricycle: () => void;
}) {
  const headingId = useId();
  const { trips, nearest } = findTrips(routes, rules, a, b, MAX_WALK_KM);
  const isClose = haversineKm(a, b) < CLOSE_POINTS_KM;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-sm font-semibold">
        {trips.length > 0 ? `Routes found (${trips.length})` : "Routes found"}
      </h2>

      {isClose && (
        <p className="rounded-lg border border-warning-border bg-warning p-3 text-sm text-warning-foreground">
          These points are close. Walking or a tricycle may be easier.
        </p>
      )}

      {trips.length > 0 ? (
        <>
          <ul className="flex flex-col gap-2">
            {trips.map((trip) => {
              const key = tripKey(trip);
              const selected = key === selectedTripKey;
              return (
                <li key={key}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onSelectTrip(selected ? null : trip)}
                    className="flex min-h-11 w-full flex-col gap-1.5 rounded-lg border p-3 text-left text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-primary/5"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{trip.route.name}</span>
                      <Badge variant="secondary">{TYPE_NAMES[trip.route.type]}</Badge>
                    </span>
                    <span className="text-muted-foreground">{trip.direction.label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      Walk {formatDistance(trip.board.offsetKm)} to board, {formatDistance(trip.alight.offsetKm)}{" "}
                      after getting off
                    </span>
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
                      <span>{displayKm(trip.rideKm)} km on the jeep</span>
                      <span className="font-semibold">{formatPeso(trip.fare.regular)}</span>
                      <span className="text-muted-foreground">
                        {formatPeso(trip.fare.discounted)} Student · Senior · PWD
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <FareBasis rules={rules} source={source} />
        </>
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          <p>No jeepney route found between these points.</p>
          {nearest && (
            <p className="text-muted-foreground">
              Nearest jeep route is {nearest.route.name}, {formatDistance(nearest.offsetKm)} away.
            </p>
          )}
          <Button variant="outline" className="h-11" onClick={onUseTricycle}>
            Check the tricycle fare instead
          </Button>
        </div>
      )}
    </section>
  );
}

function MappedRoutes({ routes }: { routes: JeepRoute[] }) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Set where you start and where you&apos;re going to find a jeep route.
      </p>
      <h2 id={headingId} className="text-sm font-semibold">
        Mapped routes ({routes.length})
      </h2>
      <ul className="flex flex-col divide-y">
        {routes.map((route) => (
          <li key={route.id} className="flex flex-col gap-1 py-2 text-sm">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{route.name}</span>
              <Badge variant="secondary">{TYPE_NAMES[route.type]}</Badge>
            </span>
            {!isTodo(route.via) && <span className="text-muted-foreground">via {route.via}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DistanceCalculator({ rules, source }: { rules: JeepFareRules; source: FareSourceInfo }) {
  const [type, setType] = useState<JeepType>("traditional");
  const [km, setKm] = useState(5);
  const ids = useId();
  const headingId = `${ids}-heading`;
  const typeLabelId = `${ids}-type`;
  const kmLabelId = `${ids}-km`;

  const rule = rules.types[type];
  const fare = jeepFare(rules, type, km);
  const clampKm = (value: number): number => Math.min(MAX_KM, Math.max(MIN_KM, Math.round(value)));

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="text-sm font-semibold">
        Compute by distance
      </h2>

      <div className="flex flex-col gap-2">
        <span id={typeLabelId} className="text-sm font-medium">
          Jeep type
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
              {TYPE_NAMES[jeepType]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        <span id={kmLabelId} className="text-sm font-medium">
          Distance
        </span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="size-11"
            aria-label="Decrease distance by 1 km"
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
            aria-label="Increase distance by 1 km"
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
          <span className="text-xs opacity-80">Regular</span>
          <span className="text-3xl font-bold text-highlight tabular-nums">{formatPeso(fare.regular)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs opacity-80">Student · Senior · PWD</span>
          <span className="text-3xl font-bold tabular-nums">{formatPeso(fare.discounted)}</span>
        </div>
      </div>

      <dl className="flex flex-col gap-1 text-sm tabular-nums">
        <div className="flex justify-between gap-4">
          <dt>
            First {rule.baseKm} km ({TYPE_NAMES[type]})
          </dt>
          <dd>{formatPeso(rule.baseFare)}</dd>
        </div>
        {fare.extraKm > 0 && (
          <div className="flex justify-between gap-4">
            <dt>
              {fare.extraKm} more km × {formatPeso(rule.perSucceedingKm)}
            </dt>
            <dd>{formatPeso(fare.regular - rule.baseFare)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 text-muted-foreground">
          <dt>{Math.round(rules.discountRate * 100)}% discount</dt>
          <dd>−{formatPeso(fare.regular - fare.discounted)}</dd>
        </div>
      </dl>

      <FareBasis rules={rules} source={source} />
    </section>
  );
}

function FareBasis({ rules, source }: { rules: JeepFareRules; source: FareSourceInfo }) {
  return (
    <p className="text-xs text-muted-foreground">
      Based on the {source.label} effective {formatDate(rules.effectiveDate)}. Student discount applies on
      school days. Last checked {formatDate(source.lastChecked)}.
    </p>
  );
}

function UnmappedRoutes({ routes }: { routes: JeepRoute[] }) {
  return (
    <Collapsible className="flex flex-col rounded-lg border">
      <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        Routes still being mapped ({routes.length})
        <ChevronDownIcon aria-hidden className="size-4 transition-transform group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex flex-col divide-y border-t px-3">
          {routes.map((route) => (
            <li key={route.id} className="flex flex-col gap-1 py-2 text-sm">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{route.name}</span>
                <Badge variant="secondary">{TYPE_NAMES[route.type]}</Badge>
                <Badge variant="outline" className="border-warning-border bg-warning text-warning-foreground">
                  Not yet mapped
                </Badge>
              </span>
              {!isTodo(route.via) && <span className="text-muted-foreground">via {route.via}</span>}
              <span className="text-muted-foreground">
                {isTodo(route.terminal) ? "Terminal not confirmed" : route.terminal}
              </span>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
