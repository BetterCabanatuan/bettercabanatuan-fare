"use client";

import { ArrowDownUp, LocateFixed, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { JeepPanel } from "@/components/fare/jeep-panel";
import { PlannerMap } from "@/components/fare/planner-map";
import { PointSearch } from "@/components/fare/point-search";
import { QuickPicks } from "@/components/fare/quick-picks";
import { TricyclePanel } from "@/components/fare/tricycle-panel";
import { useMyLocation } from "@/components/fare/use-my-location";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { JeepIcon, TricycleIcon } from "@/components/shared/vehicle-icons";
import type { MapLine, Place, PointKey, RouteStatus } from "@/components/fare/types";
import { Button } from "@/components/ui/button";
import type { MapRef } from "@/components/ui/map";
import type { FareSourceInfo, JeepPreviousRates, Landmark } from "@/lib/data";
import type { JeepFareRules, TricycleFareRules } from "@/lib/fare";
import { isInsideRing, sliceLine, type LngLat } from "@/lib/geo";
import { hasLine, type JeepRoute, type JeepTrip } from "@/lib/jeep-routes";
import { fetchRoadRoute, reversePlace } from "@/lib/map-services";
import { cn } from "@/lib/utils";

type Mode = "tricycle" | "jeep";
type Points = { a?: Place; b?: Place };

type FarePlannerProps = {
  tricycleRules: TricycleFareRules;
  tricycleSource: FareSourceInfo;
  jeepRules: JeepFareRules;
  jeepPreviousRates: JeepPreviousRates;
  jeepSource: FareSourceInfo;
  jeepRoutes: JeepRoute[];
  landmarks: Landmark[];
  boundary: LngLat[];
};

const formatPosition = ([lng, lat]: LngLat): string => `${lat.toFixed(5)},${lng.toFixed(5)}`;

const parsePosition = (value: string | null): LngLat | undefined => {
  const [lat, lng] = (value ?? "").split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) && value ? [lng, lat] : undefined;
};

const placeFromUrl = (value: string | null, label: string): Place | undefined => {
  const position = parsePosition(value);
  return position && { position, label };
};

const pointsKey = ({ a, b }: Points): string =>
  a && b ? `${formatPosition(a.position)};${formatPosition(b.position)}` : "";

/** Keeps mode and points in the address so a trip can be shared or bookmarked. */
function writeUrl(mode: Mode, { a, b }: Points): void {
  const params = new URLSearchParams();
  if (mode === "jeep") params.set("mode", "jeep");
  if (a) params.set("a", formatPosition(a.position));
  if (b) params.set("b", formatPosition(b.position));
  const query = params.toString();
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
}

/** The trip draws over its whole route, which stays highlighted as the picked one. */
function tripLines(trip: JeepTrip, { a, b }: Points): MapLine[] {
  const walks: MapLine[] = [
    a && { id: "walk-a", line: [a.position, trip.board.point], kind: "walk" as const },
    b && { id: "walk-b", line: [trip.alight.point, b.position], kind: "walk" as const },
  ].filter((line) => line !== undefined);

  return [
    { id: "picked", line: trip.direction.line, kind: "routeActive" },
    { id: "ride", line: sliceLine(trip.direction.line, trip.board.alongKm, trip.alight.alongKm), kind: "ride" },
    ...walks,
  ];
}

export function FarePlanner({
  tricycleRules,
  tricycleSource,
  jeepRules,
  jeepPreviousRates,
  jeepSource,
  jeepRoutes,
  landmarks,
  boundary,
}: FarePlannerProps) {
  const { dict } = useDictionary();
  const searchParams = useSearchParams();
  const mode: Mode = searchParams.get("mode") === "jeep" ? "jeep" : "tricycle";

  const [points, setPoints] = useState<Points>(() => ({
    a: placeFromUrl(searchParams.get("a"), dict.planner.sharedLocation),
    b: placeFromUrl(searchParams.get("b"), dict.planner.sharedLocation),
  }));
  const [editing, setEditing] = useState<PointKey>(points.a ? "b" : "a");
  const [routeResult, setRouteResult] = useState<{ key: string; status: RouteStatus }>({
    key: "",
    status: { state: "idle" },
  });
  const [selectedTrip, setSelectedTrip] = useState<{ key: string; trip: JeepTrip } | null>(null);
  const [highlightedRouteId, setHighlightedRouteId] = useState<string | null>(null);
  const mapRef = useRef<MapRef>(null);

  const currentKey = pointsKey(points);
  const aPosition = points.a?.position;
  const bPosition = points.b?.position;

  // The road route comes from an outside service, so it is synced in an effect. Both modes
  // draw it: jeep mode shows it until the rider picks a trip.
  useEffect(() => {
    if (!aPosition || !bPosition) return;
    const controller = new AbortController();
    fetchRoadRoute(aPosition, bPosition, controller.signal)
      .then((route) =>
        setRouteResult({
          key: currentKey,
          status: route ? { state: "ready", route } : { state: "error", reason: "no-route" },
        }),
      )
      .catch(() => {
        if (!controller.signal.aborted) {
          setRouteResult({ key: currentKey, status: { state: "error", reason: "unreachable" } });
        }
      });
    return () => controller.abort();
  }, [currentKey, aPosition, bPosition]);

  const route: RouteStatus = !currentKey
    ? { state: "idle" }
    : routeResult.key === currentKey
      ? routeResult.status
      : { state: "loading" };

  const trip = selectedTrip?.key === currentKey ? selectedTrip.trip : null;

  const roadLines: MapLine[] = route.state === "ready" ? [{ id: "road", line: route.route.line, kind: "road" }] : [];
  const drawableRoutes = jeepRoutes.filter(hasLine);
  const highlightedRoute = drawableRoutes.find((preset) => preset.id === highlightedRouteId);
  const pickedLines: MapLine[] = highlightedRoute
    ? [{ id: "picked", line: highlightedRoute.directions[0].line, kind: "routeActive" }]
    : [];

  const lines: MapLine[] =
    mode === "tricycle"
      ? roadLines
      : [
          ...drawableRoutes
            .filter((preset) => preset !== highlightedRoute)
            .map((preset): MapLine => ({ id: preset.id, line: preset.directions[0].line, kind: "route" })),
          ...(trip ? tripLines(trip, points) : [...pickedLines, ...roadLines]),
        ];

  const outsideCity = [points.a, points.b].some(
    (place) => place !== undefined && !isInsideRing(place.position, boundary),
  );

  const updatePoints = (next: Points): void => {
    setPoints(next);
    writeUrl(mode, next);
  };

  const setPlace = (key: PointKey, place: Place): void => {
    const next = { ...points, [key]: place };
    updatePoints(next);
    setEditing(key === "a" && !next.b ? "b" : key);
  };

  /** Places a pin right away, then swaps in a readable name once it arrives. */
  const dropPin = (key: PointKey, position: LngLat): void => {
    setPlace(key, { position, label: dict.planner.droppedPin });
    reversePlace(position)
      .then((place) => {
        // Nothing nameable nearby: the pin keeps its "Dropped pin" label.
        if (!place) return;
        setPoints((current) =>
          // Keep the exact dropped position; only the name comes from the lookup.
          current[key]?.position === position ? { ...current, [key]: { ...place, position } } : current,
        );
      })
      .catch(() => undefined);
  };

  const handleMapClick = (position: LngLat): void => {
    const key: PointKey = !points.a ? "a" : !points.b ? "b" : editing;
    dropPin(key, position);
  };

  // The map's own locate control and the panel button both set A this way.
  const setFromLocation = (position: LngLat): void => dropPin("a", position);

  const myLocation = useMyLocation(points.a?.position, (position) => {
    setFromLocation(position);
    // With B set, fitting both pins takes over; otherwise bring the new pin into view.
    if (points.b) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mapRef.current?.flyTo({ center: position, zoom: 15, duration: reduceMotion ? 0 : 1200 });
  });

  // Picks fill the field being edited, or else whichever point is still missing.
  const pickTarget: PointKey | null = !points[editing]
    ? editing
    : !points.a
      ? "a"
      : !points.b
        ? "b"
        : null;

  const switchMode = (next: Mode): void => writeUrl(next, points);

  const highlightRoute = (routeId: string | null): void => {
    setHighlightedRouteId(routeId);
    // A trip on another route would contradict the highlight.
    if (trip && trip.route.id !== routeId) setSelectedTrip(null);
  };

  const selectTrip = (next: JeepTrip | null): void => {
    setSelectedTrip(next && { key: currentKey, trip: next });
    setHighlightedRouteId(next ? next.route.id : null);
  };

  const swap = (): void => updatePoints({ a: points.b, b: points.a });

  const clear = (): void => {
    updatePoints({});
    setEditing("a");
  };

  const clearPoint = (key: PointKey): void => {
    updatePoints({ ...points, [key]: undefined });
    setEditing(key);
  };

  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      <section
        aria-labelledby="planner-heading"
        className="order-2 flex flex-col gap-5 bg-muted/40 p-4 sm:p-6 lg:order-1 lg:max-h-[calc(100dvh-4.5rem)] lg:w-[440px] lg:shrink-0 lg:overflow-y-auto lg:border-r"
      >
        <div className="flex flex-col gap-1">
          <h1 id="planner-heading" className="text-2xl font-extrabold tracking-tight">
            {dict.planner.heading}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dict.planner.intro}
          </p>
        </div>

        <div
          role="group"
          aria-label={dict.planner.vehicle}
          className="grid grid-cols-2 gap-1 rounded-xl border bg-card p-1"
        >
          {(["tricycle", "jeep"] as const).map((option) => {
            const Icon = option === "tricycle" ? TricycleIcon : JeepIcon;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                onClick={() => switchMode(option)}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  mode === option
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-6" />
                {option === "tricycle" ? dict.planner.tricycle : dict.planner.jeep}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-xs">
          <div>
            <PointSearch
              id="point-a"
              label={dict.planner.from}
              pin="a"
              value={points.a}
              landmarks={landmarks}
              active={editing === "a"}
              onActivate={() => setEditing("a")}
              onSelect={(place) => setPlace("a", place)}
              onClear={() => clearPoint("a")}
              labelAction={
                <button
                  type="button"
                  onClick={myLocation.locate}
                  // aria-disabled rather than disabled, so keyboard focus stays on the button.
                  aria-disabled={myLocation.locating}
                  className="-my-1.5 -mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:text-muted-foreground aria-disabled:no-underline"
                >
                  <LocateFixed aria-hidden className="size-4" />
                  {myLocation.locating ? dict.planner.locating : dict.planner.useMyLocation}
                </button>
              }
            />
            <div role="status">
              {myLocation.error && (
                <p className="mt-2 rounded-lg border border-warning-border bg-warning px-3 py-2 text-sm text-warning-foreground">
                  {myLocation.error === "denied" ? dict.planner.locationDenied : dict.planner.locationFailed}
                </p>
              )}
            </div>
          </div>
          <PointSearch
            id="point-b"
            label={dict.planner.to}
            pin="b"
            value={points.b}
            landmarks={landmarks}
            active={editing === "b"}
            onActivate={() => setEditing("b")}
            onSelect={(place) => setPlace("b", place)}
            onClear={() => clearPoint("b")}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="lg" className="h-11" onClick={swap} disabled={!points.a && !points.b}>
              <ArrowDownUp aria-hidden="true" />
              {dict.planner.swap}
            </Button>
            <Button variant="ghost" size="lg" className="h-11" onClick={clear} disabled={!points.a && !points.b}>
              <X aria-hidden="true" />
              {dict.planner.clear}
            </Button>
          </div>
          {pickTarget && landmarks.length > 0 && (
            <div className="border-t pt-4">
              <QuickPicks landmarks={landmarks} pin={pickTarget} onPick={(place) => setPlace(pickTarget, place)} />
            </div>
          )}
        </div>

        {mode === "tricycle" ? (
          <TricyclePanel
            rules={tricycleRules}
            source={tricycleSource}
            route={route}
            hasBothPoints={Boolean(currentKey)}
            outsideCity={outsideCity}
          />
        ) : (
          <JeepPanel
            rules={jeepRules}
            previousRates={jeepPreviousRates}
            source={jeepSource}
            routes={jeepRoutes}
            a={points.a?.position}
            b={points.b?.position}
            route={route}
            hasBothPoints={Boolean(currentKey)}
            selectedTripKey={trip ? `${trip.route.id}:${trip.direction.id}` : null}
            onSelectTrip={selectTrip}
            highlightedRouteId={highlightedRouteId}
            onHighlightRoute={highlightRoute}
            onUseTricycle={() => switchMode("tricycle")}
          />
        )}
      </section>

      <div className="order-1 h-[55dvh] lg:sticky lg:top-0 lg:order-2 lg:h-[calc(100dvh-4.5rem)] lg:flex-1">
        <PlannerMap
          ref={mapRef}
          mode={mode}
          a={points.a}
          b={points.b}
          lines={lines}
          boundary={boundary}
          routes={jeepRoutes}
          highlightedRouteId={highlightedRouteId}
          onHighlightRoute={highlightRoute}
          onMapClick={handleMapClick}
          onPinMove={dropPin}
          onPickPlace={setPlace}
          onLocate={setFromLocation}
          loading={route.state === "loading"}
          className="h-full"
        />
      </div>
    </main>
  );
}
