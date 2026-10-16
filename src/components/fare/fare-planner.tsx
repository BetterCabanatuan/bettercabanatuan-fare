"use client";

import { ArrowDownUp, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { JeepPanel } from "@/components/fare/jeep-panel";
import { PlannerMap } from "@/components/fare/planner-map";
import { PointSearch } from "@/components/fare/point-search";
import { TricyclePanel } from "@/components/fare/tricycle-panel";
import type { MapLine, Place, PointKey, RouteStatus } from "@/components/fare/types";
import { Button } from "@/components/ui/button";
import type { FareSourceInfo, Landmark } from "@/lib/data";
import type { JeepFareRules, TricycleFareRules } from "@/lib/fare";
import { isInsideRing, sliceLine, type LngLat } from "@/lib/geo";
import type { JeepRoute, JeepTrip } from "@/lib/jeep-routes";
import { fetchRoadRoute, reversePlace } from "@/lib/map-services";
import { cn } from "@/lib/utils";

type Mode = "tricycle" | "jeep";
type Points = { a?: Place; b?: Place };

type FarePlannerProps = {
  tricycleRules: TricycleFareRules;
  tricycleSource: FareSourceInfo;
  jeepRules: JeepFareRules;
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

const placeFromUrl = (value: string | null): Place | undefined => {
  const position = parsePosition(value);
  return position && { position, label: "Shared location" };
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

function tripLines(trip: JeepTrip, { a, b }: Points): MapLine[] {
  const walks: MapLine[] = [
    a && { id: "walk-a", line: [a.position, trip.board.point], kind: "walk" as const },
    b && { id: "walk-b", line: [trip.alight.point, b.position], kind: "walk" as const },
  ].filter((line) => line !== undefined);

  return [
    { id: "faded", line: trip.direction.line, kind: "faded" },
    { id: "ride", line: sliceLine(trip.direction.line, trip.board.alongKm, trip.alight.alongKm), kind: "ride" },
    ...walks,
  ];
}

export function FarePlanner({
  tricycleRules,
  tricycleSource,
  jeepRules,
  jeepSource,
  jeepRoutes,
  landmarks,
  boundary,
}: FarePlannerProps) {
  const searchParams = useSearchParams();
  const mode: Mode = searchParams.get("mode") === "jeep" ? "jeep" : "tricycle";

  const [points, setPoints] = useState<Points>(() => ({
    a: placeFromUrl(searchParams.get("a")),
    b: placeFromUrl(searchParams.get("b")),
  }));
  const [editing, setEditing] = useState<PointKey>(points.a ? "b" : "a");
  const [routeResult, setRouteResult] = useState<{ key: string; status: RouteStatus }>({
    key: "",
    status: { state: "idle" },
  });
  const [selectedTrip, setSelectedTrip] = useState<{ key: string; trip: JeepTrip } | null>(null);

  const currentKey = pointsKey(points);
  const aPosition = points.a?.position;
  const bPosition = points.b?.position;

  // The road route comes from an outside service, so it is synced in an effect.
  useEffect(() => {
    if (mode !== "tricycle" || !aPosition || !bPosition) return;
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
  }, [mode, currentKey, aPosition, bPosition]);

  const route: RouteStatus = !currentKey
    ? { state: "idle" }
    : routeResult.key === currentKey
      ? routeResult.status
      : { state: "loading" };

  const trip = selectedTrip?.key === currentKey ? selectedTrip.trip : null;

  const lines: MapLine[] =
    mode === "tricycle"
      ? route.state === "ready"
        ? [{ id: "road", line: route.route.line, kind: "road" }]
        : []
      : trip
        ? tripLines(trip, points)
        : [];

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
    setPlace(key, { position, label: "Dropped pin" });
    reversePlace(position)
      .then((place) =>
        setPoints((current) =>
          // Keep the exact dropped position; only the name comes from the lookup.
          current[key]?.position === position ? { ...current, [key]: { ...place, position } } : current,
        ),
      )
      .catch(() => undefined);
  };

  const handleMapClick = (position: LngLat): void => {
    const key: PointKey = !points.a ? "a" : !points.b ? "b" : editing;
    dropPin(key, position);
  };

  const switchMode = (next: Mode): void => writeUrl(next, points);

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
        className="order-2 flex flex-col gap-5 p-4 sm:p-6 lg:order-1 lg:max-h-[calc(100dvh-4.5rem)] lg:w-[420px] lg:shrink-0 lg:overflow-y-auto lg:border-r"
      >
        <div className="flex flex-col gap-1">
          <h1 id="planner-heading" className="text-2xl font-extrabold tracking-tight">
            Where are you going?
          </h1>
          <p className="text-sm text-muted-foreground">
            Tap the map or search for your start and end points.
          </p>
        </div>

        <div role="group" aria-label="Vehicle" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(["tricycle", "jeep"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => switchMode(option)}
              className={cn(
                "min-h-11 rounded-lg text-sm font-semibold transition-colors",
                mode === option ? "bg-background shadow-sm ring-2 ring-primary" : "text-muted-foreground",
              )}
            >
              {option === "tricycle" ? "Tricycle" : "Jeep"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <PointSearch
            id="point-a"
            label="From"
            pin="a"
            value={points.a}
            landmarks={landmarks}
            active={editing === "a"}
            onActivate={() => setEditing("a")}
            onSelect={(place) => setPlace("a", place)}
            onClear={() => clearPoint("a")}
          />
          <PointSearch
            id="point-b"
            label="To"
            pin="b"
            value={points.b}
            landmarks={landmarks}
            active={editing === "b"}
            onActivate={() => setEditing("b")}
            onSelect={(place) => setPlace("b", place)}
            onClear={() => clearPoint("b")}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={swap} disabled={!points.a && !points.b}>
              <ArrowDownUp aria-hidden="true" />
              Swap
            </Button>
            <Button variant="ghost" size="lg" onClick={clear} disabled={!points.a && !points.b}>
              <X aria-hidden="true" />
              Clear
            </Button>
          </div>
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
            source={jeepSource}
            routes={jeepRoutes}
            a={points.a?.position}
            b={points.b?.position}
            selectedTripKey={trip ? `${trip.route.id}:${trip.direction.id}` : null}
            onSelectTrip={(next) => setSelectedTrip(next && { key: currentKey, trip: next })}
            onUseTricycle={() => switchMode("tricycle")}
          />
        )}
      </section>

      <div className="order-1 h-[55dvh] lg:sticky lg:top-0 lg:order-2 lg:h-[calc(100dvh-4.5rem)] lg:flex-1">
        <PlannerMap
          a={points.a}
          b={points.b}
          lines={lines}
          boundary={boundary}
          onMapClick={handleMapClick}
          onPinMove={dropPin}
          onLocate={(position) => dropPin("a", position)}
          loading={mode === "tricycle" && route.state === "loading"}
          className="h-full"
        />
      </div>
    </main>
  );
}
