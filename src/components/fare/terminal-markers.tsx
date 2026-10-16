"use client";

import { useId, useState } from "react";

import { RoutePopup } from "@/components/fare/route-popup";
import type { Place, PointKey } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import { JeepIcon } from "@/components/shared/vehicle-icons";
import { MapMarker, MarkerContent } from "@/components/ui/map";
import type { LngLat } from "@/lib/geo";
import { fill } from "@/lib/i18n/locales";
import type { JeepRoute } from "@/lib/jeep-routes";
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
  const idPrefix = useId();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const terminals = groupTerminals(routes);
  const open = terminals.find((terminal) => terminal.key === openKey);
  const markerId = (index: number): string => `${idPrefix}-terminal-${index}`;

  const close = (): void => {
    setOpenKey(null);
    if (open) document.getElementById(markerId(terminals.indexOf(open)))?.focus();
  };

  const pick = (key: PointKey, terminal: Terminal): void => {
    onPickPlace(key, {
      position: terminal.position,
      label: terminal.name ?? dict.planner.terminal,
      detail: terminal.name ? dict.planner.terminal : undefined,
    });
    close();
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
        <RoutePopup
          key={open.key}
          position={open.position}
          title={open.name ?? dict.planner.terminal}
          subtitle={dict.planner.terminalRoutes}
          routes={open.routes}
          highlightedRouteId={highlightedRouteId}
          onHighlightRoute={onHighlightRoute}
          leadingPick="a"
          onPick={(key) => pick(key, open)}
          onClose={close}
          onDismiss={() => setOpenKey(null)}
        />
      )}
    </>
  );
}
