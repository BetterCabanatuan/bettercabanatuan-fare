"use client";

import type { MapMouseEvent } from "maplibre-gl";
import { useEffect } from "react";

import type { MapLine, Place, PointKey } from "@/components/fare/types";
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  useMap,
} from "@/components/ui/map";
import type { LngLat } from "@/lib/geo";
import { cn } from "@/lib/utils";

const CABANATUAN_CENTER: LngLat = [120.9667, 15.4865];
const ROUTE_BLUE = "#1B3F8B";
const LINE_GREY = "#6B7280";

type PlannerMapProps = {
  a?: Place;
  b?: Place;
  lines: MapLine[];
  boundary: LngLat[];
  onMapClick: (position: LngLat) => void;
  onPinMove: (key: PointKey, position: LngLat) => void;
  onLocate: (position: LngLat) => void;
  loading?: boolean;
  className?: string;
};

export function PlannerMap({
  a,
  b,
  lines,
  boundary,
  onMapClick,
  onPinMove,
  onLocate,
  loading = false,
  className,
}: PlannerMapProps) {
  const pins = [
    { key: "a" as const, place: a },
    { key: "b" as const, place: b },
  ];

  return (
    <Map theme="light" center={CABANATUAN_CENTER} zoom={13} className={className}>
      <MapRoute
        id="planner-boundary"
        coordinates={boundary}
        color={LINE_GREY}
        width={1.5}
        opacity={0.7}
        dashArray={[3, 2]}
        interactive={false}
      />

      {lines.map((line) => (
        <PlannerLine key={`${line.id}-${line.kind}`} line={line} />
      ))}

      {pins.map(({ key, place }) =>
        place ? (
          <MapMarker
            key={key}
            longitude={place.position[0]}
            latitude={place.position[1]}
            draggable
            onDragEnd={({ lng, lat }) => onPinMove(key, [lng, lat])}
          >
            <MarkerContent>
              <PinIcon pin={key} />
            </MarkerContent>
          </MapMarker>
        ) : null,
      )}

      <MapControls
        position="bottom-right"
        showZoom
        showLocate
        onLocate={({ longitude, latitude }) => onLocate([longitude, latitude])}
      />
      <MapClickHandler onMapClick={onMapClick} />
      <FitToTrip a={a} b={b} lines={lines} />
      {loading && <LoadingBar />}
    </Map>
  );
}

function PlannerLine({ line }: { line: MapLine }) {
  const id = `planner-${line.id}-${line.kind}`;

  if (line.kind === "faded") {
    return (
      <MapRoute
        id={id}
        coordinates={line.line}
        color={LINE_GREY}
        width={3}
        opacity={0.5}
        interactive={false}
      />
    );
  }
  if (line.kind === "walk") {
    return (
      <MapRoute
        id={id}
        coordinates={line.line}
        color={LINE_GREY}
        width={3}
        opacity={0.9}
        dashArray={[1, 1.5]}
        interactive={false}
      />
    );
  }
  // White casing first so the blue line sits on top and stays visible over busy tiles (spec §6.3).
  return (
    <>
      <MapRoute
        id={`${id}-casing`}
        coordinates={line.line}
        color="#FFFFFF"
        width={9}
        opacity={1}
        interactive={false}
      />
      <MapRoute
        id={id}
        coordinates={line.line}
        color={ROUTE_BLUE}
        width={6}
        opacity={1}
        interactive={false}
      />
    </>
  );
}

/** Pin graphic: 32px circle inside a 44px drag target. Letters keep A and B apart without colour. */
function PinIcon({ pin }: { pin: PointKey }) {
  return (
    <div className="flex size-11 items-center justify-center">
      <span
        role="img"
        aria-label={pin === "a" ? "Point A" : "Point B"}
        className={cn(
          "flex size-8 items-center justify-center rounded-full text-sm font-bold shadow-md",
          pin === "a"
            ? "bg-[#15181C] text-white ring-2 ring-white"
            : "bg-[#F5C518] text-[#15181C] ring-2 ring-[#15181C]",
        )}
      >
        {pin.toUpperCase()}
      </span>
    </div>
  );
}

function MapClickHandler({ onMapClick }: { onMapClick: (position: LngLat) => void }) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    const handleClick = (event: MapMouseEvent) => {
      // MapLibre also reports clicks on markers as map clicks; those must not move a pin.
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest(".maplibregl-marker")) return;
      onMapClick([event.lngLat.lng, event.lngLat.lat]);
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onMapClick]);

  return null;
}

function FitToTrip({ a, b, lines }: { a?: Place; b?: Place; lines: MapLine[] }) {
  const { map } = useMap();

  // Faded lines are background context (other jeep routes), not part of this trip.
  const tripLines = lines.filter((line) => line.kind !== "faded");
  const shouldFit = (a !== undefined && b !== undefined) || tripLines.length > 0;
  const points = [a?.position, b?.position, ...tripLines.flatMap((line) => line.line)].filter(
    (point): point is LngLat => point !== undefined,
  );
  const lngs = points.map(([lng]) => lng);
  const lats = points.map(([, lat]) => lat);
  // Plain numbers as effect deps, so a re-render with the same trip (e.g. a passenger
  // count change) does not pull the map away from where the user panned.
  const west = Math.min(...lngs);
  const south = Math.min(...lats);
  const east = Math.max(...lngs);
  const north = Math.max(...lats);

  useEffect(() => {
    if (!map || !shouldFit || !Number.isFinite(west)) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.fitBounds(
      [
        [west, south],
        [east, north],
      ],
      { padding: 64, maxZoom: 16, duration: reduceMotion ? 0 : 600 },
    );
  }, [map, shouldFit, west, south, east, north]);

  return null;
}

function LoadingBar() {
  return (
    <div
      role="progressbar"
      aria-label="Loading route"
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 overflow-hidden bg-primary/15"
    >
      <style href="planner-map-loading-bar" precedence="default">
        {`@keyframes planner-map-loading { from { transform: translateX(-100%); } to { transform: translateX(250%); } }`}
      </style>
      <div className="h-full w-2/5 bg-primary motion-safe:animate-[planner-map-loading_1.2s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:animate-pulse" />
    </div>
  );
}
