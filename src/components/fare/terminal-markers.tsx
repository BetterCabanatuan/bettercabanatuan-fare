"use client";

import type { MapMouseEvent } from "maplibre-gl";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import type { Place, PointKey } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { JeepIcon } from "@/components/shared/vehicle-icons";
import { Button } from "@/components/ui/button";
import { MapMarker, MapPopup, MarkerContent, useMap } from "@/components/ui/map";
import type { LngLat } from "@/lib/geo";
import { fill } from "@/lib/i18n/locales";
import { hasLine, isApproximate, type JeepRoute } from "@/lib/jeep-routes";
import { cn } from "@/lib/utils";

type Terminal = {
  key: string;
  position: LngLat;
  /** Unset while the terminal's name is still a TODO in the data. */
  name?: string;
  routes: JeepRoute[];
};

type TerminalMarkersProps = {
  routes: JeepRoute[];
  highlightedRouteId: string | null;
  onHighlightRoute: (routeId: string | null) => void;
  onPickPlace: (key: PointKey, place: Place) => void;
};

const isTodo = (value: string | undefined): boolean => !value || value.startsWith("TODO");

/** Routes that queue at the same spot share one marker. */
function groupTerminals(routes: JeepRoute[]): Terminal[] {
  const terminals: Terminal[] = [];
  for (const route of routes) {
    if (!route.terminalPosition || route.status === "suspended") continue;
    const key = route.terminalPosition.join(",");
    const name = isTodo(route.terminal) ? undefined : route.terminal;
    const existing = terminals.find((terminal) => terminal.key === key);
    if (existing) {
      existing.routes.push(route);
      existing.name ??= name;
    } else {
      terminals.push({ key, position: route.terminalPosition, name, routes: [route] });
    }
  }
  return terminals;
}

export function TerminalMarkers({
  routes,
  highlightedRouteId,
  onHighlightRoute,
  onPickPlace,
}: TerminalMarkersProps) {
  const { dict } = useDictionary();
  const { map } = useMap();
  const idPrefix = useId();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const terminals = groupTerminals(routes);
  const open = terminals.find((terminal) => terminal.key === openKey);
  const markerId = (index: number): string => `${idPrefix}-terminal-${index}`;
  const openIndex = open ? terminals.indexOf(open) : -1;

  // The popup is attached to the map only after it renders, so focus moves in from here,
  // which runs after the popup's own effects.
  useEffect(() => {
    popupRef.current?.querySelector("button")?.focus();
  }, [openKey]);

  // A tap elsewhere on the map closes the popup. MapLibre's own closeOnClick would also
  // fire for taps on the marker itself and reopen it straight away.
  useEffect(() => {
    if (!map || !openKey) return;
    const handleClick = (event: MapMouseEvent) => {
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest(".maplibregl-marker, .maplibregl-popup")) return;
      setOpenKey(null);
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, openKey]);

  const close = (): void => {
    setOpenKey(null);
    document.getElementById(markerId(openIndex))?.focus();
  };

  const pick = (key: PointKey, terminal: Terminal): void => {
    onPickPlace(key, {
      position: terminal.position,
      label: terminal.name ?? dict.planner.terminal,
      detail: terminal.name ? dict.planner.terminal : undefined,
    });
    close();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Escape") close();
  };

  return (
    <>
      {terminals.map((terminal, index) => {
        const isOpen = terminal.key === openKey;
        const holdsHighlight = terminal.routes.some((route) => route.id === highlightedRouteId);
        return (
          <MapMarker key={terminal.key} longitude={terminal.position[0]} latitude={terminal.position[1]}>
            <MarkerContent>
              <button
                type="button"
                id={markerId(index)}
                aria-label={
                  terminal.name ? fill(dict.planner.terminalMarker, { name: terminal.name }) : dict.planner.terminal
                }
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                onClick={() => setOpenKey(isOpen ? null : terminal.key)}
                className="group flex size-11 items-center justify-center rounded-full outline-none"
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg bg-[#15181C] text-white shadow-md ring-2 ring-white group-focus-visible:ring-4 group-focus-visible:ring-ring",
                    (isOpen || holdsHighlight) && "ring-[#C2410C]",
                  )}
                >
                  <JeepIcon className="size-5" />
                </span>
              </button>
            </MarkerContent>
          </MapMarker>
        );
      })}

      {open && (
        <MapPopup
          key={open.key}
          longitude={open.position[0]}
          latitude={open.position[1]}
          offset={24}
          closeOnClick={false}
          onClose={() => setOpenKey(null)}
          className="w-64 max-w-[calc(100vw-3rem)]"
        >
          <div
            ref={popupRef}
            role="dialog"
            aria-labelledby={`${idPrefix}-popup-title`}
            onKeyDown={handleKeyDown}
            className="flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-0.5 pt-1">
                <p id={`${idPrefix}-popup-title`} className="text-sm font-bold text-balance">
                  {open.name ?? dict.planner.terminal}
                </p>
                <p className="text-xs text-muted-foreground">{dict.planner.terminalRoutes}</p>
              </div>
              <button
                type="button"
                aria-label={dict.planner.closeTerminal}
                onClick={close}
                className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>

            <ul className="-mx-1 flex max-h-48 flex-col overflow-y-auto">
              {open.routes.map((route) => {
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
              <Button size="lg" className="h-11" onClick={() => pick("a", open)}>
                {dict.planner.boardHere}
              </Button>
              <Button variant="outline" size="lg" className="h-11" onClick={() => pick("b", open)}>
                {dict.planner.getOffHere}
              </Button>
            </div>
          </div>
        </MapPopup>
      )}
    </>
  );
}
