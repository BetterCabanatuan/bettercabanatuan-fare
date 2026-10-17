"use client";

import type { MapMouseEvent } from "maplibre-gl";
import { useEffect, useState } from "react";

import type { RoadRoute } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { Map, MapControls, MapMarker, MapRoute, MarkerContent, useMap } from "@/components/ui/map";
import type { LngLat } from "@/lib/geo";
import { fill } from "@/lib/i18n/locales";
import { fetchRoadThrough } from "@/lib/map-services";
import type { RouteStop } from "@/lib/routes/waypoints";
import { cn } from "@/lib/utils";

// Waits for the rider to stop tapping or dragging before asking OSRM, which has fair-use limits.
const DEBOUNCE_MS = 500;
const ROUTE_BLUE = "#1B3F8B";

export type RoadLine =
  /** The previous road, if any, stays on the map while the new one loads. */
  | { status: "loading"; road: RoadRoute | null }
  | { status: "ready"; road: RoadRoute }
  | { status: "none" }
  | { status: "unreachable" };

type Fetched = { key: string; road: RoadRoute | null } | { key: string; road: "unreachable" };

/**
 * The OSRM road through A, the stops and B, in that order; null until there are two
 * points. Only coordinates are sent. A newer set of points cancels the request in flight.
 */
export function useRoadLine(points: LngLat[] | null): RoadLine | null {
  // A string key, so a re-render with the same points doesn't refetch.
  const key = points && points.length >= 2 ? JSON.stringify(points) : null;
  const [fetched, setFetched] = useState<Fetched | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      // The key is JSON of LngLat pairs built above, so parsing it gives them back.
      fetchRoadThrough(JSON.parse(key), controller.signal)
        .then((road) => setFetched({ key, road }))
        .catch(() => {
          if (!controller.signal.aborted) setFetched({ key, road: "unreachable" });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  if (!key) return null;
  if (fetched?.key !== key) {
    const previous = fetched && fetched.road !== "unreachable" ? fetched.road : null;
    return { status: "loading", road: previous };
  }
  if (fetched.road === "unreachable") return { status: "unreachable" };
  return fetched.road ? { status: "ready", road: fetched.road } : { status: "none" };
}

type RouteRoadMapProps = {
  a: LngLat;
  b: LngLat;
  /** In travel order. */
  stops: RouteStop[];
  line: RoadLine | null;
  /** Given when the rider can tap to add stops; the map is read-only without it. */
  onAddStop?: (position: LngLat) => void;
  onMoveStop?: (id: string, position: LngLat) => void;
  className?: string;
};

/** A suggested jeep route: A, numbered stops, B and the road through them. */
export function RouteRoadMap({ a, b, stops, line, onAddStop, onMoveStop, className }: RouteRoadMapProps) {
  const { dict } = useDictionary();
  const road = line && "road" in line ? line.road : null;

  return (
    <Map theme="light" center={a} zoom={12} className={cn("w-full overflow-hidden rounded-lg border", className)}>
      {road && (
        <MapRoute
          id="suggested-road"
          coordinates={road.line}
          color={ROUTE_BLUE}
          width={5}
          opacity={line?.status === "loading" ? 0.35 : 0.9}
          interactive={false}
        />
      )}
      <EndMarker position={a} pin="a" label={dict.planner.pointA} />
      <EndMarker position={b} pin="b" label={dict.planner.pointB} />
      {stops.map((stop, index) => (
        <MapMarker
          key={stop.id}
          longitude={stop.position[0]}
          latitude={stop.position[1]}
          draggable={Boolean(onMoveStop)}
          className="z-10"
          onDragEnd={({ lng, lat }) => onMoveStop?.(stop.id, [lng, lat])}
        >
          <MarkerContent>
            <div className="flex size-11 items-center justify-center">
              <span
                role="img"
                aria-label={fill(dict.suggest.stopLabel, { number: index + 1 })}
                className="flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#1B3F8B] shadow-md ring-2 ring-[#1B3F8B]"
              >
                {index + 1}
              </span>
            </div>
          </MarkerContent>
        </MapMarker>
      ))}
      <MapControls position="bottom-right" showZoom />
      <FitToEnds a={a} b={b} />
      {onAddStop && <TapToAdd onAdd={onAddStop} />}
    </Map>
  );
}

function EndMarker({ position, pin, label }: { position: LngLat; pin: "a" | "b"; label: string }) {
  return (
    <MapMarker longitude={position[0]} latitude={position[1]} className="z-20">
      <MarkerContent>
        <div className="flex size-11 items-center justify-center">
          <span
            role="img"
            aria-label={label}
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-sm font-bold shadow-md",
              pin === "a" ? "bg-[#15181C] text-white ring-2 ring-white" : "bg-[#F5C518] text-[#15181C] ring-2 ring-[#15181C]",
            )}
          >
            {pin.toUpperCase()}
          </span>
        </div>
      </MarkerContent>
    </MapMarker>
  );
}

/** Frames A and B when either moves. Adding or dragging a stop leaves the view alone. */
function FitToEnds({ a, b }: { a: LngLat; b: LngLat }) {
  const { map } = useMap();
  const [aLng, aLat] = a;
  const [bLng, bLat] = b;

  useEffect(() => {
    if (!map) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.fitBounds(
      [
        [Math.min(aLng, bLng), Math.min(aLat, bLat)],
        [Math.max(aLng, bLng), Math.max(aLat, bLat)],
      ],
      { padding: 48, maxZoom: 16, duration: reduceMotion ? 0 : 600 },
    );
  }, [map, aLng, aLat, bLng, bLat]);

  return null;
}

function TapToAdd({ onAdd }: { onAdd: (position: LngLat) => void }) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    const handleClick = (event: MapMouseEvent) => {
      // Clicks on a marker are drags or nothing, not new stops.
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest(".maplibregl-marker")) return;
      onAdd([event.lngLat.lng, event.lngLat.lat]);
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onAdd]);

  return null;
}
