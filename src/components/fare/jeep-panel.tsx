"use client";

import { useId } from "react";
import { ChevronDownIcon, MapPinIcon, RouteIcon } from "lucide-react";

import { JeepFareBasis, JeepFareCalculator } from "@/components/fare/jeep-fare-calculator";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { JeepIcon } from "@/components/shared/vehicle-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { FareSourceInfo, JeepPreviousRates } from "@/lib/data";
import { displayKm, formatPeso, type JeepFareRules } from "@/lib/fare";
import { haversineKm, type LngLat } from "@/lib/geo";
import { fill } from "@/lib/i18n/locales";
import { findTrips, isMapped, type JeepRoute, type JeepTrip } from "@/lib/jeep-routes";

// Walking limit is not yet decided (spec §4.3 FR-9, open item 5); 500 m is the spec's example.
const MAX_WALK_KM = 0.5;
const CLOSE_POINTS_KM = 0.5;

const formatDistance = (km: number): string =>
  km < 1 ? `${Math.round(km * 100) * 10} m` : `${displayKm(km)} km`;

const tripKey = (trip: JeepTrip): string => `${trip.route.id}:${trip.direction.id}`;

const isTodo = (value: string | undefined): boolean => !value || value.startsWith("TODO");

type JeepPanelProps = {
  rules: JeepFareRules;
  previousRates: JeepPreviousRates;
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
  previousRates,
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
    <div className="flex flex-col gap-4">
      {mapped.length === 0 ? (
        <RoutesEmpty />
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

      <JeepFareCalculator rules={rules} previousRates={previousRates} source={source} />

      {unmapped.length > 0 && <UnmappedRoutes routes={unmapped} />}
    </div>
  );
}

function RoutesEmpty() {
  const { dict } = useDictionary();
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <JeepIcon className="size-8" />
      </span>
      <h2 id={headingId} className="text-lg font-bold tracking-tight text-balance">
        {dict.jeep.stillMappingTitle}
      </h2>
      <p className="text-sm text-pretty text-muted-foreground">{dict.jeep.stillMapping}</p>
      <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-left text-xs font-medium">
        <RouteIcon aria-hidden className="mt-px size-4 shrink-0 text-primary" />
        {dict.jeep.comingSoon}
      </p>
    </section>
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
  const { dict } = useDictionary();
  const headingId = useId();
  const { trips, nearest } = findTrips(routes, rules, a, b, MAX_WALK_KM);
  const isClose = haversineKm(a, b) < CLOSE_POINTS_KM;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-sm font-semibold">
        {trips.length > 0 ? fill(dict.jeep.routesFoundCount, { count: trips.length }) : dict.jeep.routesFound}
      </h2>

      {isClose && (
        <p className="rounded-lg border border-warning-border bg-warning p-3 text-sm text-warning-foreground">
          {dict.jeep.closePoints}
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
                      <Badge variant="secondary">{dict.jeep[trip.route.type]}</Badge>
                    </span>
                    <span className="text-muted-foreground">{trip.direction.label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {fill(dict.jeep.walk, {
                        board: formatDistance(trip.board.offsetKm),
                        alight: formatDistance(trip.alight.offsetKm),
                      })}
                    </span>
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
                      <span>{fill(dict.jeep.onJeep, { km: displayKm(trip.rideKm) })}</span>
                      <span className="font-semibold">{formatPeso(trip.fare.regular)}</span>
                      <span className="text-muted-foreground">
                        {formatPeso(trip.fare.discounted)} {dict.jeep.discountedRiders}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <JeepFareBasis rules={rules} source={source} />
        </>
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          <p>{dict.jeep.noTrip}</p>
          {nearest && (
            <p className="text-muted-foreground">
              {fill(dict.jeep.nearest, { name: nearest.route.name, distance: formatDistance(nearest.offsetKm) })}
            </p>
          )}
          <Button variant="outline" className="h-11" onClick={onUseTricycle}>
            {dict.jeep.useTricycle}
          </Button>
        </div>
      )}
    </section>
  );
}

function MappedRoutes({ routes }: { routes: JeepRoute[] }) {
  const { dict } = useDictionary();
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{dict.jeep.setPoints}</p>
      <h2 id={headingId} className="text-sm font-semibold">
        {fill(dict.jeep.mappedRoutes, { count: routes.length })}
      </h2>
      <ul className="flex flex-col divide-y">
        {routes.map((route) => (
          <li key={route.id} className="flex flex-col gap-1 py-2 text-sm">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{route.name}</span>
              <Badge variant="secondary">{dict.jeep[route.type]}</Badge>
            </span>
            {!isTodo(route.via) && (
              <span className="text-muted-foreground">{fill(dict.jeep.via, { via: route.via })}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function UnmappedRoutes({ routes }: { routes: JeepRoute[] }) {
  const { dict } = useDictionary();

  return (
    <Collapsible className="flex flex-col rounded-2xl border bg-card">
      <CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl px-4 text-left text-base font-bold tracking-tight outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        {fill(dict.jeep.stillBeingMapped, { count: routes.length })}
        <ChevronDownIcon aria-hidden className="size-4 shrink-0 transition-transform group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex flex-col divide-y border-t px-4">
          {routes.map((route) => (
            <li key={route.id} className="flex items-start gap-3 py-3 text-sm">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-semibold">{route.name}</span>
                {!isTodo(route.via) && (
                  <span className="text-xs text-muted-foreground">{fill(dict.jeep.via, { via: route.via })}</span>
                )}
                <span className="flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPinIcon aria-hidden className="mt-px size-3.5 shrink-0" />
                  <span className="sr-only">{dict.jeep.terminalLabel} </span>
                  {isTodo(route.terminal) ? dict.jeep.terminalUnconfirmed : route.terminal}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant="secondary">{dict.jeep[route.type]}</Badge>
                <Badge variant="outline" className="border-warning-border bg-warning text-warning-foreground">
                  {dict.jeep.notMapped}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
