"use client";

import type { MapMouseEvent } from "maplibre-gl";
import { useEffect, useState, type Ref } from "react";

import { MapHint } from "@/components/fare/map-hint";
import { ALL_LAYERS, MapLayersControl, type MapLayers } from "@/components/fare/map-layers";
import { RouteEndMarkers, StopDots } from "@/components/fare/stop-markers";
import { TerminalMarkers } from "@/components/fare/terminal-markers";
import { roadSummary } from "@/components/fare/road-options";
import type { MapLine, Place, PointKey, RoadRoute } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  useMap,
  type MapRef,
} from "@/components/ui/map";
import { displayKm } from "@/lib/fare";
import type { LngLat } from "@/lib/geo";
import { fill } from "@/lib/i18n/locales";
import type { JeepRoute, JeepTerminal } from "@/lib/jeep-routes";
import { labelPoint } from "@/lib/road-routes";
import { cn } from "@/lib/utils";

const CABANATUAN_CENTER: LngLat = [120.9667, 15.4865];
const ROUTE_BLUE = "#1B3F8B";
const LINE_GREY = "#6B7280";
// Preset jeep routes: a muted teal in the background, orange for the one the rider picked,
// so neither reads as the blue A-to-B line.
const PRESET_TEAL = "#0F766E";
const PICKED_ORANGE = "#C2410C";

const BOUNDARY_ID = "planner-boundary";
// MapRoute names its layers "route-layer-<id>".
const layerId = (id: string): string => `route-layer-${id}`;
const lineId = (line: MapLine): string => `planner-${line.id}-${line.kind}`;
// Roads the rider can switch to. Clicks on them pick the road instead of moving a pin.
const ROAD_CHOICE_PREFIX = "planner-road-choice-";
// The picked road's casing, which the other roads sit under.
const PICKED_ROAD_CASING = layerId(`${lineId({ id: "road", line: [], kind: "road" })}-casing`);

type PlannerMapProps = {
  mode: "tricycle" | "jeep";
  a?: Place;
  b?: Place;
  lines: MapLine[];
  /** Roads between A and B to choose from, when there is more than one. */
  roadChoices: { roads: RoadRoute[]; selected: number } | null;
  onSelectRoad: (index: number) => void;
  boundary: LngLat[];
  /** Jeep routes whose terminals, far ends and (when highlighted) stops get markers in jeep mode. */
  routes: JeepRoute[];
  /** Listed terminals and stops, shown in jeep mode. */
  terminals: JeepTerminal[];
  highlightedRouteId: string | null;
  onHighlightRoute: (routeId: string | null) => void;
  onMapClick: (position: LngLat) => void;
  onPinMove: (key: PointKey, position: LngLat) => void;
  onPickPlace: (key: PointKey, place: Place) => void;
  onLocate: (position: LngLat) => void;
  onLocateError: (error: GeolocationPositionError) => void;
  loading?: boolean;
  className?: string;
  ref?: Ref<MapRef>;
};

export function PlannerMap({
  mode,
  a,
  b,
  lines,
  roadChoices,
  onSelectRoad,
  boundary,
  routes,
  terminals,
  highlightedRouteId,
  onHighlightRoute,
  onMapClick,
  onPinMove,
  onPickPlace,
  onLocate,
  onLocateError,
  loading = false,
  className,
  ref,
}: PlannerMapProps) {
  const pins = [
    { key: "a" as const, place: a },
    { key: "b" as const, place: b },
  ];
  // Same order as a map tap fills the points (FR-3).
  const nextPin: PointKey | null = !a ? "a" : !b ? "b" : null;
  // The road line slides under the picked route, whichever of the two is drawn first.
  const pickedLine = lines.find((line) => line.kind === "routeActive");
  const belowPicked = pickedLine && layerId(`${lineId(pickedLine)}-casing`);
  // Only jeep mode has layers to hide. The picked route is "routeActive", not "route", so it stays.
  const [layers, setLayers] = useState<MapLayers>(ALL_LAYERS);
  const shownLines = layers.routes ? lines : lines.filter((line) => line.kind !== "route");

  return (
    // The muted backdrop reads as a map area while tiles are still loading.
    <Map ref={ref} theme="light" center={CABANATUAN_CENTER} zoom={13} className={cn("bg-muted", className)}>
      <MapRoute
        id={BOUNDARY_ID}
        coordinates={boundary}
        color={LINE_GREY}
        width={1.5}
        opacity={0.7}
        dashArray={[3, 2]}
        interactive={false}
      />

      {shownLines.map((line) => (
        <PlannerLine key={`${line.id}-${line.kind}`} line={line} belowPicked={belowPicked} />
      ))}

      {roadChoices && (
        <RoadChoices roads={roadChoices.roads} selected={roadChoices.selected} onSelect={onSelectRoad} />
      )}

      {mode === "jeep" && (
        <>
          <TerminalMarkers
            terminals={terminals}
            routes={routes}
            showAll={layers.terminals}
            highlightedRouteId={highlightedRouteId}
            onHighlightRoute={onHighlightRoute}
            onPickPlace={onPickPlace}
          />
          <RouteEndMarkers
            routes={routes}
            showAll={layers.routeEnds}
            highlightedRouteId={highlightedRouteId}
            onHighlightRoute={onHighlightRoute}
            onPickPlace={onPickPlace}
          />
          <StopDots route={routes.find((route) => route.id === highlightedRouteId)} />
        </>
      )}

      {pins.map(({ key, place }) =>
        place ? (
          <MapMarker
            key={key}
            longitude={place.position[0]}
            latitude={place.position[1]}
            draggable
            // Keeps A and B above terminal markers that mount later.
            className="z-10"
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
        onLocateError={onLocateError}
      >
        {mode === "jeep" && <MapLayersControl layers={layers} onChange={setLayers} />}
      </MapControls>
      <MapClickHandler onMapClick={onMapClick} />
      <FitToTrip a={a} b={b} lines={lines} roads={roadChoices?.roads ?? []} />
      {loading && <LoadingBar />}
      {nextPin && <MapHint pin={nextPin} mode={mode} />}
    </Map>
  );
}

function PlannerLine({ line, belowPicked }: { line: MapLine; belowPicked?: string }) {
  const id = lineId(line);

  if (line.kind === "route") {
    return (
      <MapRoute
        id={id}
        coordinates={line.line}
        color={PRESET_TEAL}
        width={3}
        opacity={0.6}
        // Under everything else, even lines that were already on the map.
        beforeId={layerId(BOUNDARY_ID)}
        interactive={false}
      />
    );
  }
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
  if (line.kind === "routeActive") {
    return (
      <>
        <MapRoute
          id={`${id}-casing`}
          coordinates={line.line}
          color="#FFFFFF"
          width={8}
          opacity={1}
          interactive={false}
        />
        <MapRoute
          id={id}
          coordinates={line.line}
          color={PICKED_ORANGE}
          width={5}
          opacity={1}
          interactive={false}
        />
      </>
    );
  }
  // White casing first so the blue line sits on top and stays visible over busy tiles (spec §6.3).
  const beforeId = line.kind === "road" ? belowPicked : undefined;
  return (
    <>
      <MapRoute
        id={`${id}-casing`}
        coordinates={line.line}
        color="#FFFFFF"
        width={9}
        opacity={1}
        beforeId={beforeId}
        interactive={false}
      />
      <MapRoute
        id={id}
        coordinates={line.line}
        color={ROUTE_BLUE}
        width={6}
        opacity={1}
        beforeId={beforeId}
        interactive={false}
      />
    </>
  );
}

/** Pin graphic: 32px circle inside a 44px drag target. Letters keep A and B apart without colour. */
function PinIcon({ pin }: { pin: PointKey }) {
  const { dict } = useDictionary();
  return (
    <div className="flex size-11 items-center justify-center">
      <span
        role="img"
        aria-label={pin === "a" ? dict.planner.pointA : dict.planner.pointB}
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

/**
 * The roads the rider did not pick, drawn grey under the picked one, and a label on every
 * road with its time and distance. Clicking a grey road or any label picks that road.
 */
function RoadChoices({
  roads,
  selected,
  onSelect,
}: {
  roads: RoadRoute[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const { dict } = useDictionary();
  const t = dict.roads;
  const lines = roads.map((road) => road.line);

  return (
    <>
      {roads.map((road, index) =>
        index === selected ? null : (
          <RoadChoiceLine key={`${road.distanceKm}:${road.durationMin}`} road={road} onSelect={() => onSelect(index)} />
        ),
      )}
      {roads.map((road, index) => {
        const [longitude, latitude] = labelPoint(
          road.line,
          lines.filter((_, other) => other !== index),
        );
        const isSelected = index === selected;
        return (
          <MapMarker
            key={`${road.distanceKm}:${road.durationMin}`}
            longitude={longitude}
            latitude={latitude}
            // Above the other labels, below the A and B pins.
            className={isSelected ? "z-[5]" : undefined}
          >
            <MarkerContent>
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={fill(t.pickRoad, { summary: roadSummary(road, t) })}
                onClick={() => onSelect(index)}
                className="flex min-h-11 items-center p-1.5 outline-none focus-visible:[&>span]:ring-3 focus-visible:[&>span]:ring-ring/50"
              >
                <span
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap tabular-nums shadow-md",
                    isSelected ? "bg-[#1B3F8B] text-white" : "bg-white text-[#15181C] ring-1 ring-black/15",
                  )}
                >
                  {fill(t.mapLabel, {
                    minutes: Math.max(1, Math.round(road.durationMin)),
                    km: displayKm(road.distanceKm).toFixed(1),
                  })}
                </span>
              </button>
            </MarkerContent>
          </MapMarker>
        );
      })}
    </>
  );
}

function RoadChoiceLine({ road, onSelect }: { road: RoadRoute; onSelect: () => void }) {
  const id = `${ROAD_CHOICE_PREFIX}${road.distanceKm}`;
  return (
    <>
      <MapRoute
        id={`${id}-casing`}
        coordinates={road.line}
        color="#FFFFFF"
        width={8}
        opacity={1}
        beforeId={PICKED_ROAD_CASING}
        onClick={onSelect}
      />
      <MapRoute
        id={id}
        coordinates={road.line}
        color={LINE_GREY}
        width={5}
        opacity={0.75}
        beforeId={PICKED_ROAD_CASING}
        onClick={onSelect}
      />
    </>
  );
}

function MapClickHandler({ onMapClick }: { onMapClick: (position: LngLat) => void }) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    const handleClick = (event: MapMouseEvent) => {
      // MapLibre also reports clicks on markers and popups as map clicks; those must not move a pin.
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest(".maplibregl-marker, .maplibregl-popup")) return;
      // A click on a road choice picks that road (its own handler), so the pins stay put.
      const onRoadChoice = map
        .queryRenderedFeatures(event.point)
        .some((feature) => feature.layer.id.startsWith(layerId(ROAD_CHOICE_PREFIX)));
      if (onRoadChoice) return;
      onMapClick([event.lngLat.lng, event.lngLat.lat]);
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onMapClick]);

  return null;
}

function FitToTrip({ a, b, lines, roads }: { a?: Place; b?: Place; lines: MapLine[]; roads: RoadRoute[] }) {
  const { map } = useMap();

  // Background lines (faded, preset routes) are context, not part of this trip. With a ride
  // drawn, the picked route's full line is context too, so the view frames the trip itself.
  const hasRide = lines.some((line) => line.kind === "ride");
  const tripLines = lines.filter(
    (line) => line.kind !== "faded" && line.kind !== "route" && !(hasRide && line.kind === "routeActive"),
  );
  const shouldFit = (a !== undefined && b !== undefined) || tripLines.length > 0;
  // Every road choice is framed, so picking one never moves the map.
  const points = [
    a?.position,
    b?.position,
    ...tripLines.flatMap((line) => line.line),
    ...roads.flatMap((road) => road.line),
  ].filter(
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
      {
        // The short phone map can't spare 64px a side: keep the top clear of the hint
        // and the right clear of the zoom buttons, and tighten the rest.
        padding: map.getContainer().clientHeight < 400 ? { top: 56, right: 60, bottom: 24, left: 24 } : 64,
        maxZoom: 16,
        duration: reduceMotion ? 0 : 600,
      },
    );
  }, [map, shouldFit, west, south, east, north]);

  return null;
}

function LoadingBar() {
  const { dict } = useDictionary();
  return (
    <div
      role="progressbar"
      aria-label={dict.planner.loadingRoute}
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 overflow-hidden bg-primary/15"
    >
      <style href="planner-map-loading-bar" precedence="default">
        {`@keyframes planner-map-loading { from { transform: translateX(-100%); } to { transform: translateX(250%); } }`}
      </style>
      <div className="h-full w-2/5 bg-primary motion-safe:animate-[planner-map-loading_1.2s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:animate-pulse" />
    </div>
  );
}
