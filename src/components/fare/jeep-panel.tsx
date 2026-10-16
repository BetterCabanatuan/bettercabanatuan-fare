"use client";

import { useId } from "react";
import { ChevronDownIcon } from "lucide-react";

import { JeepFareCalculator } from "@/components/fare/jeep-fare-calculator";
import { JeepRoadFare } from "@/components/fare/jeep-road-fare";
import { ApproximateBadge, JeepRouteList, UnmappedRoutes } from "@/components/fare/jeep-route-list";
import type { RouteStatus } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { JeepIcon } from "@/components/shared/vehicle-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { FareSourceInfo, JeepPreviousRates } from "@/lib/data";
import { displayKm, formatPeso, type JeepFareRules } from "@/lib/fare";
import { haversineKm, type LngLat } from "@/lib/geo";
import { fill } from "@/lib/i18n/locales";
import { findTrips, hasLine, isApproximate, type JeepRoute, type JeepTrip } from "@/lib/jeep-routes";

// Walking limit is not yet decided (spec §4.3 FR-9, open item 5); 500 m is the spec's example.
const MAX_WALK_KM = 0.5;
const CLOSE_POINTS_KM = 0.5;

const formatDistance = (km: number): string =>
  km < 1 ? `${Math.round(km * 100) * 10} m` : `${displayKm(km)} km`;

const tripKey = (trip: JeepTrip): string => `${trip.route.id}:${trip.direction.id}`;

type JeepPanelProps = {
  rules: JeepFareRules;
  previousRates: JeepPreviousRates;
  source: FareSourceInfo;
  routes: JeepRoute[];
  a?: LngLat;
  b?: LngLat;
  route: RouteStatus;
  hasBothPoints: boolean;
  selectedTripKey: string | null;
  onSelectTrip: (trip: JeepTrip | null) => void;
  highlightedRouteId: string | null;
  onHighlightRoute: (routeId: string | null) => void;
  onUseTricycle: () => void;
};

export function JeepPanel({
  rules,
  previousRates,
  source,
  routes,
  a,
  b,
  route,
  hasBothPoints,
  selectedTripKey,
  onSelectTrip,
  highlightedRouteId,
  onHighlightRoute,
  onUseTricycle,
}: JeepPanelProps) {
  const { dict } = useDictionary();
  const withLine = routes.filter(hasLine);
  const withoutLine = routes.filter((jeepRoute) => !hasLine(jeepRoute));
  const tripPoints = hasBothPoints && a && b ? { a, b } : null;

  return (
    <div className="flex flex-col gap-5">
      {tripPoints && haversineKm(tripPoints.a, tripPoints.b) < CLOSE_POINTS_KM && (
        <p className="rounded-lg border border-warning-border bg-warning p-3 text-sm text-warning-foreground">
          {dict.jeep.closePoints}
        </p>
      )}

      {tripPoints && withLine.length > 0 && (
        <TripResults
          rules={rules}
          routes={withLine}
          a={tripPoints.a}
          b={tripPoints.b}
          selectedTripKey={selectedTripKey}
          onSelectTrip={(trip) => {
            onSelectTrip(trip);
            onHighlightRoute(trip ? trip.route.id : null);
          }}
          onUseTricycle={onUseTricycle}
        />
      )}

      <JeepRoadFare rules={rules} source={source} route={route} hasBothPoints={hasBothPoints} />

      {withLine.length > 0 ? (
        <JeepRouteList
          routes={withLine}
          highlightedRouteId={highlightedRouteId}
          onHighlightRoute={onHighlightRoute}
        />
      ) : (
        <RoutesEmpty />
      )}

      {withoutLine.length > 0 && <UnmappedRoutes routes={withoutLine} />}

      {hasBothPoints ? (
        // The trip fare leads once A and B are set; the by-distance tools stay one tap away.
        <Collapsible className="flex flex-col gap-4">
          <CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl border bg-card px-4 text-left text-base font-bold tracking-tight outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
            {dict.jeep.fareByDistance}
            <ChevronDownIcon aria-hidden className="size-4 shrink-0 transition-transform group-data-panel-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-4">
            <JeepFareCalculator rules={rules} previousRates={previousRates} source={source} />
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <JeepFareCalculator rules={rules} previousRates={previousRates} source={source} />
      )}
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
    </section>
  );
}

function TripResults({
  rules,
  routes,
  a,
  b,
  selectedTripKey,
  onSelectTrip,
  onUseTricycle,
}: {
  rules: JeepFareRules;
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

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-base font-bold tracking-tight">
        {trips.length > 0 ? fill(dict.jeep.routesFoundCount, { count: trips.length }) : dict.jeep.routesFound}
      </h2>

      {trips.length > 0 ? (
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
                    {isApproximate(trip.route) && <ApproximateBadge />}
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
