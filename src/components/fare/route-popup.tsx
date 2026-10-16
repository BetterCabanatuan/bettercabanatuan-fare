"use client";

import type { MapMouseEvent } from "maplibre-gl";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type KeyboardEvent } from "react";

import type { PointKey } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { Button } from "@/components/ui/button";
import { MapPopup, useMap } from "@/components/ui/map";
import type { LngLat } from "@/lib/geo";
import { hasLine, isApproximate, type JeepRoute } from "@/lib/jeep-routes";
import { cn } from "@/lib/utils";

type RoutePopupProps = {
  position: LngLat;
  title: string;
  subtitle: string;
  /** Routes that pass this spot; those with a line can be highlighted from the list. */
  routes: JeepRoute[];
  highlightedRouteId: string | null;
  onHighlightRoute: (routeId: string | null) => void;
  /** Which pick leads: riders board at a terminal and get off at a route's far end. */
  leadingPick: PointKey;
  onPick: (key: PointKey) => void;
  /** The close button or Escape. */
  onClose: () => void;
  /** A tap elsewhere on the map. */
  onDismiss: () => void;
};

/** Popup shared by terminal and route-end markers: the routes at that spot plus A/B picks. */
export function RoutePopup({
  position,
  title,
  subtitle,
  routes,
  highlightedRouteId,
  onHighlightRoute,
  leadingPick,
  onPick,
  onClose,
  onDismiss,
}: RoutePopupProps) {
  const { dict } = useDictionary();
  const { map } = useMap();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // The popup is attached to the map only after MapPopup's own effects run, so focus
  // moves in from here, one level up.
  useEffect(() => {
    dialogRef.current?.querySelector("button")?.focus();
  }, []);

  // A tap elsewhere on the map closes the popup. MapLibre's own closeOnClick would also
  // fire for taps on the marker itself and reopen it straight away.
  useEffect(() => {
    if (!map) return;
    const handleClick = (event: MapMouseEvent) => {
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest(".maplibregl-marker, .maplibregl-popup")) return;
      onDismiss();
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onDismiss]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Escape") onClose();
  };

  const picks: PointKey[] = leadingPick === "a" ? ["a", "b"] : ["b", "a"];
  const pickLabel: Record<PointKey, string> = { a: dict.planner.boardHere, b: dict.planner.getOffHere };

  return (
    <MapPopup
      longitude={position[0]}
      latitude={position[1]}
      offset={24}
      closeOnClick={false}
      onClose={onDismiss}
      className="w-64 max-w-[calc(100vw-3rem)]"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5 pt-1">
            <p id={titleId} className="text-sm font-bold text-balance">
              {title}
            </p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <button
            type="button"
            aria-label={dict.planner.closeTerminal}
            onClick={onClose}
            className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>

        <ul className="-mx-1 flex max-h-48 flex-col overflow-y-auto">
          {routes.map((route) => {
            const highlighted = route.id === highlightedRouteId;
            return (
              <li key={route.id}>
                {hasLine(route) ? (
                  <button
                    type="button"
                    aria-pressed={highlighted}
                    onClick={() => onHighlightRoute(highlighted ? null : route.id)}
                    className="flex min-h-11 w-full flex-col justify-center rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:bg-[#C2410C]/10 aria-pressed:font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={cn("h-1 w-4 shrink-0 rounded-full", highlighted ? "bg-[#C2410C]" : "bg-[#0F766E]/60")}
                      />
                      {route.name}
                    </span>
                    {isApproximate(route) && (
                      <span className="pl-6 text-xs font-normal text-muted-foreground">
                        {dict.planner.approximateLine}
                      </span>
                    )}
                  </button>
                ) : (
                  <p className="flex min-h-11 flex-col justify-center px-2 py-1.5 text-sm">
                    <span className="pl-6">{route.name}</span>
                    <span className="pl-6 text-xs text-muted-foreground">{dict.planner.lineNotDrawn}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <div className="grid grid-cols-2 gap-2">
          {picks.map((key, index) => (
            <Button
              key={key}
              variant={index === 0 ? "default" : "outline"}
              size="lg"
              className="h-11"
              onClick={() => onPick(key)}
            >
              {pickLabel[key]}
            </Button>
          ))}
        </div>
      </div>
    </MapPopup>
  );
}
