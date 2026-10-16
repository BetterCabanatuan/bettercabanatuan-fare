"use client";

import { useId, useState } from "react";

import { RoutePopup } from "@/components/fare/route-popup";
import type { Place, PointKey } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { MapMarker, MarkerContent, MarkerLabel, MarkerTooltip } from "@/components/ui/map";
import type { LngLat } from "@/lib/geo";
import { fill } from "@/lib/i18n/locales";
import { hasLine, type JeepRoute, type JeepStop } from "@/lib/jeep-routes";
import { cn } from "@/lib/utils";

type RouteEnd = {
  key: string;
  name: string;
  position: LngLat;
  routes: JeepRoute[];
};

type RouteEndMarkersProps = {
  routes: JeepRoute[];
  highlightedRouteId: string | null;
  onHighlightRoute: (routeId: string | null) => void;
  onPickPlace: (key: PointKey, place: Place) => void;
};

/** Routes that finish at the same spot share one marker. */
function groupEnds(routes: JeepRoute[]): RouteEnd[] {
  const ends: RouteEnd[] = [];
  for (const route of routes) {
    const last = route.stops.at(-1);
    if (!hasLine(route) || !last) continue;
    const key = last.position.join(",");
    const existing = ends.find((end) => end.key === key);
    if (existing) {
      existing.routes.push(route);
    } else {
      ends.push({ key, name: last.name, position: last.position, routes: [route] });
    }
  }
  return ends;
}

/** The far end of every drawn route: the town where the jeep turns around. */
export function RouteEndMarkers({
  routes,
  highlightedRouteId,
  onHighlightRoute,
  onPickPlace,
}: RouteEndMarkersProps) {
  const { dict } = useDictionary();
  const idPrefix = useId();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const ends = groupEnds(routes);
  const open = ends.find((end) => end.key === openKey);
  const markerId = (index: number): string => `${idPrefix}-route-end-${index}`;

  const close = (): void => {
    setOpenKey(null);
    if (open) document.getElementById(markerId(ends.indexOf(open)))?.focus();
  };

  const toggle = (end: RouteEnd): void => {
    if (end.key === openKey) {
      setOpenKey(null);
      return;
    }
    setOpenKey(end.key);
    // Opening the marker lights up its route; when several share the spot, the first,
    // unless one of them is already lit.
    if (!end.routes.some((route) => route.id === highlightedRouteId)) onHighlightRoute(end.routes[0].id);
  };

  const pick = (key: PointKey, end: RouteEnd): void => {
    onPickPlace(key, { position: end.position, label: end.name, detail: dict.planner.routeEnd });
    close();
  };

  return (
    <>
      {ends.map((end, index) => {
        const isOpen = end.key === openKey;
        const holdsHighlight = end.routes.some((route) => route.id === highlightedRouteId);
        return (
          <MapMarker key={end.key} longitude={end.position[0]} latitude={end.position[1]}>
            <MarkerContent>
              <button
                type="button"
                id={markerId(index)}
                aria-label={fill(dict.planner.routeEndMarker, { name: end.name })}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                onClick={() => toggle(end)}
                className="group flex size-11 items-center justify-center rounded-full outline-none"
              >
                <span
                  className={cn(
                    "block size-7 rounded-full bg-white shadow-md ring-2 ring-[#15181C] group-focus-visible:ring-4 group-focus-visible:ring-ring",
                    (isOpen || holdsHighlight) && "ring-[#C2410C]",
                  )}
                />
              </button>
              <MarkerLabel
                position="bottom"
                className="pointer-events-none mt-0 rounded bg-white/90 px-1 py-px text-[11px] font-semibold text-[#15181C] shadow-xs"
              >
                {/* The button already names the town, so the label is decoration to screen readers. */}
                <span aria-hidden>{end.name}</span>
              </MarkerLabel>
            </MarkerContent>
          </MapMarker>
        );
      })}

      {open && (
        <RoutePopup
          key={open.key}
          position={open.position}
          title={open.name}
          subtitle={dict.planner.routeEndRoutes}
          routes={open.routes}
          highlightedRouteId={highlightedRouteId}
          onHighlightRoute={onHighlightRoute}
          leadingPick="b"
          onPick={(key) => pick(key, open)}
          onClose={close}
          onDismiss={() => setOpenKey(null)}
        />
      )}
    </>
  );
}

const stopLabel = (dict: { stopAtKm: string }, stop: JeepStop): string =>
  stop.km === undefined ? stop.name : fill(dict.stopAtKm, { name: stop.name, km: stop.km });

/** The towns between terminal and far end of the highlighted route, dotted along its line. */
export function StopDots({ route }: { route: JeepRoute | undefined }) {
  const { dict } = useDictionary();
  if (!route) return null;

  // Terminal and far end already have their own markers.
  const between = route.stops.slice(1, -1);

  return between.map((stop, index) => {
    const label = stopLabel(dict.planner, stop);
    return (
      <MapMarker key={`${route.id}-${index}`} longitude={stop.position[0]} latitude={stop.position[1]}>
        <MarkerContent className="cursor-default">
          <span role="img" aria-label={label} className="block size-3 rounded-full bg-white shadow ring-2 ring-[#C2410C]" />
        </MarkerContent>
        <MarkerTooltip offset={10}>{label}</MarkerTooltip>
      </MapMarker>
    );
  });
}
